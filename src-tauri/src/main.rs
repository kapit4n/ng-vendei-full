//! Vendei Full — desktop shell.
//!
//! Scope of this crate, deliberately small:
//!
//! * own the lifecycle of the local Node API (start, wait for `/api/health`,
//!   stop on exit), and
//! * keep every Tauri-specific concern on the Rust side so the Angular bundle
//!   stays deployment-agnostic.
//!
//! The UI is the existing Angular application, loaded over HTTP exactly as in
//! browser mode. No Angular component was rewritten in Rust, and no business
//! logic moved here.

use std::io::{Read, Write};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{Manager, RunEvent, WebviewWindowBuilder, WindowEvent};

/// How long to wait for the API to report ready before giving up.
const READINESS_TIMEOUT: Duration = Duration::from_secs(60);
/// Gap between readiness probes. Short enough to feel instant, long enough not
/// to hammer the port.
const READINESS_POLL: Duration = Duration::from_millis(250);
/// Grace period given to the API on shutdown before SIGKILL.
const SHUTDOWN_GRACE: Duration = Duration::from_secs(5);
/// Cap on a single health response, so a misbehaving listener cannot grow the
/// read buffer without limit.
const MAX_HEALTH_RESPONSE: usize = 64 * 1024;

/// SIGTERM / SIGKILL. Pulling in the `libc` crate for two constants and one
/// syscall is not worth the dependency; these are fixed by POSIX, not by the
/// platform.
#[cfg(unix)]
const SIGTERM: i32 = 15;

#[cfg(unix)]
extern "C" {
    fn kill(pid: i32, sig: i32) -> i32;
}

/// The API child process, if this shell is managing one.
///
/// `Mutex` rather than a channel or async task: there is exactly one API per app
/// instance, it is touched on setup and again on exit, and a blocking wait
/// during startup is acceptable because the window has nothing to show yet.
struct BackendState(Mutex<Option<Child>>);

fn main() {
    let port: u16 = std::env::var("VENDEI_API_PORT")
        .ok()
        .and_then(|v| v.trim().parse().ok())
        .unwrap_or(3999);
    let api_url = format!("http://127.0.0.1:{port}");

    // Resolved before the builder runs so the injected script and the backend
    // lifecycle agree on one port, and so a bad value fails loudly here rather
    // than as a silent fallback.
    let managed = std::env::var("VENDEI_MANAGE_BACKEND")
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    // The shell's view of deployment config, injected into every document.
    //
    // `index.html` loads `assets/config/runtime-config.js` before the Angular
    // bundle, and that file *assigns* `window.__VENDEI_CONFIG__` wholesale. So
    // the shell cannot simply set the global once at startup: the page would
    // overwrite it with the browser defaults and every API call would resolve
    // against tauri://localhost. The injection is therefore reapplied on every
    // page load, after the document's own scripts have run.
    //
    // `Object.assign` onto the existing object keeps whatever a deployment
    // legitimately overrode (e.g. assetsBaseUrl) while forcing the two values
    // only the shell can know.
    let shell_config = format!(
        "Object.assign(window.__VENDEI_CONFIG__ || (window.__VENDEI_CONFIG__ = {{}}), \
         {{ apiBaseUrl: {api_url:?}, platform: 'desktop' }}); \
         window.__VENDEI_BACKEND__ = {{ url: {api_url:?}, managed: {managed} }};"
    );

    let init_script = shell_config.clone();
    let page_script = shell_config.clone();

    tauri::Builder::default()
        .manage(BackendState(Mutex::new(None)))
        .on_page_load(move |webview, _payload| {
            // Fires after the document's own scripts, so this wins over
            // runtime-config.js. Also covers dev-server reloads and HMR
            // navigations, which build a fresh document. Idempotent.
            let _ = webview.eval(&page_script);
        })
        .setup(move |app| {
            // The window is built from the tauri.conf.json entry (so size,
            // title and branding stay declarative) plus overrides that config
            // cannot express.
            //
            // The config entry sets `"create": false` so Tauri does not also
            // auto-create it — building a second window with the same label
            // fails. `initialization_script` is likewise not a config key in
            // Tauri 2, so the window must be constructed here.
            let window_config = app
                .config()
                .app
                .windows
                .first()
                .cloned()
                .ok_or("tauri.conf.json declares no windows")?;

            let window = WebviewWindowBuilder::from_config(app, &window_config)?
                // Stay hidden until the API answers, so the POS does not paint
                // a first frame full of failed requests.
                .visible(false)
                // Runs before *any* page script, closing the window between
                // navigation start and the on_page_load hook. The webview origin
                // is tauri://localhost, so booting against the wrong API base
                // would fail every request.
                .initialization_script(&init_script)
                .build()?;

            if managed {
                match start_backend() {
                    Ok(child) => store_child(app.handle(), child),
                    Err(err) => {
                        // Not fatal: a developer may run the API separately. The
                        // window still opens, and the UI reports the failure.
                        eprintln!("vendei: could not start the bundled API: {err}");
                        eprintln!(
                            "vendei: the window will open anyway; the API must be started by other means."
                        );
                    }
                }
            } else {
                println!(
                    "vendei: backend lifecycle not managed here (VENDEI_MANAGE_BACKEND unset) — expecting an API on {api_url}"
                );
            }

            // Readiness is a real HTTP probe of /api/health, not a sleep: the
            // API mounts its routes while booting, so a fixed delay would be
            // either flaky or needlessly slow.
            let health_url = format!("{api_url}/api/health");
            if wait_for_health(&health_url, READINESS_TIMEOUT) {
                println!("vendei: API reported ready at {health_url}");
            } else {
                eprintln!(
                    "vendei: API did not report ready at {health_url} within {READINESS_TIMEOUT:?}"
                );
            }

            let _ = window.show();
            let _ = window.set_focus();

            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, WindowEvent::Destroyed) {
                stop_backend(window.app_handle());
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building the Vendei application")
        .run(|app, event| match event {
            // ExitRequested covers the "user closed the window" path, which does
            // not always deliver Destroyed. stop_backend is idempotent, so being
            // called from several of these is safe.
            RunEvent::ExitRequested { .. } | RunEvent::Exit => stop_backend(app),
            _ => {}
        });
}

fn start_backend() -> Result<Child, String> {
    let dir = std::env::var("VENDEI_BACKEND_DIR")
        .map_err(|_| "VENDEI_BACKEND_DIR is not set".to_string())?;
    let port = std::env::var("VENDEI_API_PORT").unwrap_or_else(|_| "3999".to_string());
    let entry = std::env::var("VENDEI_BACKEND_ENTRY").unwrap_or_else(|_| "node".to_string());
    let script = std::env::var("VENDEI_BACKEND_SCRIPT").unwrap_or_else(|_| "./bin/www".to_string());

    println!("vendei: starting the bundled API ({entry} {script}) in {dir} on port {port}");

    // `npm start` is deliberately not used: it runs `prestart` (a migration) and
    // spawns node as a grandchild, so killing the wrapper would orphan the API
    // on its port — the exact class of leak stack-common.sh has to work around
    // for the browser modes. Spawning node directly keeps one process to
    // supervise and leaves migration timing to the caller.
    let mut command = Command::new(&entry);
    command
        .arg(&script)
        .current_dir(&dir)
        .env("PORT", &port)
        .env("NODE_ENV", "development")
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());

    // Own the child's process group so anything it spawns can be signalled
    // together; otherwise a grandchild could outlive the shell.
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }

    // Belt and braces for the abnormal-exit paths. `stop_backend` handles a
    // clean close, but nothing in a userspace app runs when the process is
    // SIGKILLed, its X connection is severed, or the machine loses power. In
    // those cases the API would keep holding its port and serve the next run
    // the wrong database. PR_SET_PDEATHSIG makes the kernel deliver SIGTERM to
    // the child at the moment the parent dies, so the leak is bounded to the
    // parent's death rather than to the next manual cleanup.
    #[cfg(target_os = "linux")]
    arm_parent_death_signal(&mut command);

    command
        .spawn()
        .map_err(|err| format!("failed to spawn {entry} {script} in {dir}: {err}"))
}

/// Ask the kernel to signal this child when its parent dies.
///
/// Implemented with `pre_exec` because the call has to happen in the forked
/// child, after `fork` and before `exec`, when its parent is still the shell.
///
/// The `getppid` re-check closes the classic race in this pattern: if the parent
/// died between `fork` and `prctl`, the signal would never be armed, and the
/// child would be reparented to init. Detecting that and exiting immediately
/// means the API is never left listening.
///
/// Only async-signal-safe calls are used, as required inside `pre_exec`.
#[cfg(target_os = "linux")]
fn arm_parent_death_signal(command: &mut Command) {
    use std::os::unix::process::CommandExt;

    unsafe {
        command.pre_exec(|| {
            if libc::prctl(libc::PR_SET_PDEATHSIG, libc::SIGTERM) != 0 {
                // Not fatal: the process-group cleanup in stop_backend still
                // covers a normal window close, so failing to arm this only
                // weakens the abnormal-exit case.
                libc::perror(b"prctl(PR_SET_PDEATHSIG)".as_ptr().cast());
                return Ok(());
            }
            // The parent may have died between fork and prctl, in which case
            // getppid() is now 1 (init) and the signal will never arrive.
            if libc::getppid() == 1 {
                libc::raise(libc::SIGTERM);
            }
            Ok(())
        });
    }
}

fn store_child(app: &tauri::AppHandle, child: Child) {
    if let Some(state) = app.try_state::<BackendState>() {
        if let Ok(mut guard) = state.0.lock() {
            *guard = Some(child);
        }
    }
}

/// Stop the API, escalating to SIGKILL if it ignores the polite request.
///
/// Idempotent: safe to call from both `WindowEvent::Destroyed` and
/// `RunEvent::Exit`, which can both fire for a single close.
fn stop_backend(app: &tauri::AppHandle) {
    let Some(state) = app.try_state::<BackendState>() else {
        return;
    };
    let taken = state.0.lock().ok().and_then(|mut guard| guard.take());
    let Some(mut child) = taken else {
        return;
    };

    let pid = child.id();
    println!("vendei: stopping the bundled API (pid {pid})");
    terminate(&mut child);
    match child.wait() {
        Ok(status) => println!("vendei: bundled API exited: {status}"),
        Err(err) => eprintln!("vendei: could not reap the bundled API (pid {pid}): {err}"),
    }
}

#[cfg(unix)]
fn terminate(child: &mut Child) {
    // A negative pid targets the process group created by `process_group(0)`,
    // so the API and anything it spawned are signalled together.
    unsafe {
        kill(-(child.id() as i32), SIGTERM);
    }

    let deadline = Instant::now() + SHUTDOWN_GRACE;
    while Instant::now() < deadline {
        match child.try_wait() {
            Ok(Some(_)) => return,
            Ok(None) => std::thread::sleep(Duration::from_millis(100)),
            Err(_) => break,
        }
    }
    eprintln!("vendei: bundled API did not exit within {SHUTDOWN_GRACE:?}; sending SIGKILL");
    let _ = child.kill();
    let _ = child.wait();
}

#[cfg(not(unix))]
fn terminate(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

/// Poll `url` until it returns HTTP 200, or the timeout elapses. Returns
/// whether it became ready.
fn wait_for_health(url: &str, timeout: Duration) -> bool {
    let Some((host, port, path)) = split_http_url(url) else {
        eprintln!("vendei: cannot parse health URL {url}");
        return false;
    };

    let deadline = Instant::now() + timeout;
    let mut attempt: u32 = 0;
    loop {
        attempt += 1;
        if probe_health(&host, port, &path) {
            println!("vendei: health check passed on attempt {attempt}");
            return true;
        }
        if Instant::now() >= deadline {
            eprintln!("vendei: health check still failing after {attempt} attempts");
            return false;
        }
        std::thread::sleep(READINESS_POLL);
    }
}

/// One readiness probe: a bare HTTP/1.0 GET over a plain TCP socket.
///
/// Hand-rolled rather than pulling in an HTTP client, because the only request
/// ever made is a GET to a loopback address and the response is checked as
/// text. No TLS, no redirects, no keep-alive, no extra dependency.
fn probe_health(host: &IpAddr, port: u16, path: &str) -> bool {
    let addr = SocketAddr::new(*host, port);
    let Ok(mut stream) = TcpStream::connect_timeout(&addr, Duration::from_millis(1000)) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_millis(2000)));

    let request = format!(
        "GET {path} HTTP/1.0\r\nHost: {addr}\r\nConnection: close\r\nAccept: application/json\r\n\r\n"
    );
    if stream.write_all(request.as_bytes()).is_err() {
        return false;
    }

    let mut response = Vec::new();
    let mut chunk = [0u8; 2048];
    while response.len() < MAX_HEALTH_RESPONSE {
        match stream.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => response.extend_from_slice(&chunk[..n]),
            Err(_) => break,
        }
    }

    let text = String::from_utf8_lossy(&response);
    let status_ok = text.starts_with("HTTP/1.1 200") || text.starts_with("HTTP/1.0 200");
    status_ok && text.contains("\"status\"")
}

/// Split `http://host:port/path` into its parts. Only plain HTTP is supported,
/// which is the only shape the local API has.
fn split_http_url(url: &str) -> Option<(IpAddr, u16, String)> {
    let rest = url.strip_prefix("http://")?;
    let (authority, path) = match rest.find('/') {
        Some(idx) => (&rest[..idx], &rest[idx..]),
        None => (rest, "/"),
    };
    let (host, port) = authority.rsplit_once(':')?;
    let port: u16 = port.parse().ok()?;
    let host: IpAddr = host.parse().unwrap_or(IpAddr::V4(Ipv4Addr::LOCALHOST));
    Some((host, port, path.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn splits_a_loopback_url() {
        let (host, port, path) = split_http_url("http://127.0.0.1:3999/api/health").unwrap();
        assert_eq!(host, IpAddr::V4(Ipv4Addr::LOCALHOST));
        assert_eq!(port, 3999);
        assert_eq!(path, "/api/health");
    }

    #[test]
    fn defaults_the_path_when_absent() {
        let (_, _, path) = split_http_url("http://127.0.0.1:3000").unwrap();
        assert_eq!(path, "/");
    }

    #[test]
    fn rejects_a_non_http_url() {
        assert!(split_http_url("https://127.0.0.1:3999").is_none());
        assert!(split_http_url("127.0.0.1:3999").is_none());
    }

    #[test]
    fn falls_back_to_loopback_for_an_unparseable_host() {
        let (host, _, _) = split_http_url("http://localhost:3999/api/health").unwrap();
        assert_eq!(host, IpAddr::V4(Ipv4Addr::LOCALHOST));
    }

    #[test]
    fn readiness_fails_fast_against_a_closed_port() {
        // Port 1 on loopback is not expected to be listening.
        let started = Instant::now();
        let ready = wait_for_health("http://127.0.0.1:1/api/health", Duration::from_millis(600));
        assert!(!ready);
        // Bounded by the timeout plus one poll interval, not by a fixed sleep.
        assert!(started.elapsed() < Duration::from_secs(5));
    }
}
