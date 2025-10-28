let notificationsCounter = 0;
const notifiedSet = new Set();

const newNotificationId = () => notificationsCounter++;
const pause = (delay) => new Promise((res) => setTimeout(res, delay));

self.addEventListener("install", (event) => {
  // self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const notify = async (payload) => {
  const { delay = 0, text, url } = payload;

  const notificationId = newNotificationId();

  delay && (await pause(delay));

  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
  });

  if (clients?.length) {
    clients.forEach((client) =>
      client.postMessage({
        action: "SHOW_NOTIFICATION",
        payload: {
          text,
          url,
          notificationId,
        },
      }),
    );
  }

  await pause(1000);

  if (!notifiedSet.has(notificationId)) {
    try {
      self.registration.showNotification(text, {
        icon: "https://800147.github.io/tests/img/favicon_72.png",
        data: { url },
      });
    } catch (e) {
      console.error("can't notify");
    }
  }

  notifiedSet.delete(notificationId);
};

const notified = (payload) => {
  const { notificationId } = payload;
  notifiedSet.add(notificationId);
};

self.addEventListener("message", async (event) => {
  const { action, payload } = event.data;

  switch (action) {
    case "NOTIFY":
      event.waitUntil(notify(payload));
      break;
    case "NOTIFIED":
      notified(payload);
      break;
  }
});

self.addEventListener("notificationclick", (event) => {
  if (!event.notification.data?.url) {
    return;
  }

  event.preventDefault();
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  try {
    const { text, url } = event.data.json();

    notify({ text, url });

    // Пример с расширенными опциями
    // const notificationOptions = {
    //   body: pushData.body || "Новое сообщение",
    //   icon: pushData.icon || "/icon-192x192.png",
    //   badge: pushData.badge || "/badge-72x72.png",
    //   image: pushData.image,
    //   tag: pushData.tag || "default",
    //   data: pushData.data,
    //   requireInteraction: pushData.requireInteraction || false,
    //   silent: pushData.silent || false,
    //   vibrate: pushData.vibrate || [200, 100, 200],
    //   timestamp: Date.now(),
    //   actions: pushData.actions || [],
    // };
    //
    // self.registration.showNotification(pushData.title, notificationOptions);
  } catch (error) {
    console.error("Push notification error:", error);
  }
});
