#!/usr/bin/env node
// Minimal static server that reproduces the nginx.conf rules, so `MODE=prod`
// can verify a production-mode run without installing nginx.
//
// Mirrors, deliberately and only:
//   - SPA fallback: unknown paths that are not files return index.html
//   - collection/API proxying to WEB_API_TARGET, with the same path list
//   - runtime-config.js served no-store
//   - static assets cached hard
//
// It is NOT a production web server. Use nginx for that.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/ng-vendei-full');
const port = Number(process.argv[3] ?? 4200);
const apiTarget = process.env.WEB_API_TARGET ?? 'http://127.0.0.1:3000';

// Keep in sync with src/app/core/api/api-paths.ts and nginx.conf.
const PROXIED = new Set([
  'api',
  'products',
  'productPresentations',
  'categories',
  'clients',
  'cashiers',
  'vendors',
  'unitOfMeasures',
  'orders',
  'orderDetails',
  'purchase-items',
  'inventory-lots',
  'storeProfiles',
  'catalogTemplates',
  'productAttributeDefinitions',
  'productAttributeValues',
  'productVariants',
  'ang-questions',
  'ang-exams',
  'ang-results',
  'uploads',
]);

const CACHEABLE = new Set([
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const decoded = decodeURIComponent(url.pathname);

  // ── API proxy ─────────────────────────────────────────────────────────
  // Match on the first path segment, which is how nginx.conf does it: a
  // request to /products carries no trailing slash and must still be proxied.
  const segment = decoded.replace(/^\//, '').split('/')[0];
  if (PROXIED.has(segment)) {
    const target = `${apiTarget}${decoded}${url.search}`;
    fetch(target, {
      method: req.method,
      headers: { 'content-type': req.headers['content-type'] ?? 'application/json' },
    })
      .then(async (upstream) => {
        const body = Buffer.from(await upstream.arrayBuffer());
        send(
          res,
          upstream.status,
          { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
          body
        );
      })
      .catch((err) => send(res, 502, { 'content-type': 'application/json' }, JSON.stringify({ error: String(err) })));
    return;
  }

  // ── Static files ──────────────────────────────────────────────────────
  const relative = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, relative);

  // Refuse to serve anything outside the build output.
  if (!filePath.startsWith(root)) {
    send(res, 403, { 'content-type': 'text/plain' }, 'Forbidden');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = extname(filePath);

    // runtime-config.js must never be cached, or a rewritten config is ignored.
    if (relative === '/assets/config/runtime-config.js') {
      res.writeHead(200, { 'content-type': TYPES['.js'], 'cache-control': 'no-store, no-cache, must-revalidate' });
      createReadStream(filePath).pipe(res);
      return;
    }

    const headers = { 'content-type': TYPES[ext] ?? 'application/octet-stream' };
    if (CACHEABLE.has(ext)) {
      headers['cache-control'] = 'public, immutable, max-age=2592000';
    }
    res.writeHead(200, headers);
    createReadStream(filePath).pipe(res);
    return;
  }

  // ── SPA fallback ──────────────────────────────────────────────────────
  const indexPath = join(root, 'index.html');
  if (!existsSync(indexPath)) {
    send(res, 500, { 'content-type': 'text/plain' }, 'index.html missing from build output');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' });
  createReadStream(indexPath).pipe(res);
});

server.listen(port, () => {
  console.log(`serve-static: ${root}`);
  console.log(`serve-static: listening on http://localhost:${port} (proxying to ${apiTarget})`);
});
