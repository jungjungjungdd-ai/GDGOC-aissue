import { matchPrecache, precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

// 오프라인일 때 /offline, /shelters 같은 화면 주소로 들어와도 앱(index.html)을 띄운다
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode !== 'navigate' || new URL(request.url).pathname.startsWith('/api/')) return;
  event.respondWith(fetch(request).catch(() => matchPrecache('/index.html')));
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || '재난 알림', {
      body: data.body,
      icon: '/pwa-192x192.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});