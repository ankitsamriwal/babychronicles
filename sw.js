const CACHE = 'babychronicles-v5';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'bc-notify').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

self.addEventListener('periodicsync', e => {
  if (e.tag !== 'bc-reminders') return;
  e.waitUntil(
    caches.open('bc-notify').then(c => c.match('/due-reminders.json')).then(r => r && r.json()).then(d => {
      if (!d || d.paused || !d.items) return;
      return Promise.all(d.items.map(i => self.registration.showNotification('Baby Chronicles', {
        body: i.title, tag: i.id, icon: 'icon-192.png', data: {url: './?rem=1'}
      })));
    }).catch(() => {})
  );
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});
