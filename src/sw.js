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
    Promise.all([
      self.registration.showNotification(data.title || '재난 알림', {
        body: data.body,
        icon: '/pwa-192x192.png',
        data: { url: data.url || '/' },
      }),
      // 앱이 열려 있으면 '최근 받은 재난문자'로 기록하라고 알림
      data.alertId &&
        self.clients
          .matchAll({ type: 'window', includeUncontrolled: true })
          .then((list) => list.forEach((c) => c.postMessage({ type: 'alert-received', alertId: data.alertId }))),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});