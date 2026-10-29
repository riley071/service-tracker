/* Keep business data and authenticated responses out of Cache Storage.
 * Network-first navigation avoids holding clients on an obsolete app version.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workfolio — Offline</title><body style="font:18px/1.6 system-ui;padding:32px;background:#F5F7F3;color:#132F2A"><h1>You are offline</h1><p>Connect to the internet to open Workfolio and access your workspace.</p><button onclick="location.reload()" style="padding:12px 24px;font:inherit">Try again</button></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )));
});
