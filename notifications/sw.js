const pause = (delay) => new Promise((res) => setTimeout(res, delay));

self.addEventListener("install", (event) => {
  // self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const notify = async (payload) => {
  const { delay = 0, text, url } = payload;

  delay && (await pause(delay));

  try {
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

    // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
    return self.registration.showNotification(text, {
      badge: "https://800147.github.io/tests/img/favicon_72.png",
      icon: "https://800147.github.io/tests/img/favicon_72.png",
      silent: false,
      data: { url },
    });
  } catch (e) {
    console.error("can't notify");
  }
};

self.addEventListener("message", async (event) => {
  const { action, payload } = event.data;

  switch (action) {
    case "NOTIFY":
      event.waitUntil(notify(payload));
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
  } catch (error) {
    console.error("Push notification error:", error);
  }
});
