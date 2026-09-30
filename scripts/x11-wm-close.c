/*
 * Send WM_DELETE_WINDOW to the first window whose name matches a substring.
 *
 * Why this exists
 * ---------------
 * The acceptance criterion for the desktop shell is "closing the window stops
 * the bundled API", and the shell only does that on the graceful exit path
 * (WindowEvent::Destroyed / RunEvent::Exit -> stop_backend). Signalling the
 * Tauri process group, which is what scripts/run-tauri.sh uses for Ctrl-C
 * teardown, proves the opposite direction: SIGTERM is fatal to a Rust process
 * by default, so the exit hook never runs and only the PR_SET_PDEATHSIG
 * backstop keeps the API from leaking. That path has to stay covered too, but
 * it cannot stand in for the graceful one.
 *
 * WM_DELETE_WINDOW is exactly what a window manager forwards to a client when a
 * user clicks the titlebar close button, so this reproduces the real user
 * action. `xkill` would not: it destroys the X connection, which the app sees
 * as an abrupt disconnect rather than a close request.
 *
 * Deliberately no dependency on wmctrl or xdotool, which are frequently absent
 * from CI images; scripts/verify-tauri.sh prefers those when present and falls
 * back to compiling this.
 *
 * Build: gcc -O2 -o x11-wm-close x11-wm-close.c -lX11
 * Usage: x11-wm-close <window-title-substring>
 * Exit:  0 closed, 1 no matching window, 2 could not run.
 */
#include <X11/Xatom.h>
#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int name_matches(Display *dpy, Window w, const char *want) {
  char *name = NULL;
  if (XFetchName(dpy, w, &name) && name) {
    int hit = strstr(name, want) != NULL;
    XFree(name);
    return hit;
  }
  return 0;
}

int main(int argc, char **argv) {
  if (argc < 2) {
    fprintf(stderr, "usage: x11-wm-close <title>\n");
    return 2;
  }
  const char *want = argv[1];

  Display *dpy = XOpenDisplay(NULL);
  if (!dpy) {
    fprintf(stderr, "x11-wm-close: cannot open display\n");
    return 2;
  }

  Window root = DefaultRootWindow(dpy);
  Window parent, *kids = NULL;
  unsigned int n = 0;
  if (!XQueryTree(dpy, root, &root, &parent, &kids, &n)) {
    fprintf(stderr, "x11-wm-close: XQueryTree failed\n");
    XCloseDisplay(dpy);
    return 2;
  }

  Atom wm_protocols = XInternAtom(dpy, "WM_PROTOCOLS", False);
  Atom wm_delete = XInternAtom(dpy, "WM_DELETE_WINDOW", False);
  int closed = 0;

  for (unsigned int i = 0; i < n && !closed; i++) {
    if (!name_matches(dpy, kids[i], want)) {
      continue;
    }
    Atom *protos = NULL;
    int nprotos = 0;
    if (XGetWMProtocols(dpy, kids[i], &protos, &nprotos) && protos) {
      for (int p = 0; p < nprotos; p++) {
        if (protos[p] != wm_delete) {
          continue;
        }
        XClientMessageEvent ev;
        memset(&ev, 0, sizeof(ev));
        ev.type = ClientMessage;
        ev.window = kids[i];
        ev.message_type = wm_protocols;
        ev.format = 32;
        ev.data.l[0] = (long)wm_delete;
        ev.data.l[1] = CurrentTime;
        XSendEvent(dpy, kids[i], False, NoEventMask, (XEvent *)&ev);
        XFlush(dpy);
        printf("x11-wm-close: closed 0x%lx (%s)\n", kids[i], want);
        closed = 1;
        break;
      }
      XFree(protos);
    }
  }

  if (kids) {
    XFree(kids);
  }
  XCloseDisplay(dpy);

  if (!closed) {
    fprintf(stderr, "x11-wm-close: no closable window matching \"%s\"\n", want);
    return 1;
  }
  return 0;
}
