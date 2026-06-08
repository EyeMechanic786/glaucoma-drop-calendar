/* Service worker helper — open app when a drop reminder is tapped */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = '/glaucoma-drop-calendar/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('glaucoma-drop-calendar') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    }),
  );
});
