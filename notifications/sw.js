const pause = (delay) => new Promise((res) => setTimeout(res, delay));

const notify = async (payload) => {
  const { delay = 0, text, url } = payload;

  delay && (await pause(delay));

  try {
    // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
    return self.registration.showNotification(text, {
      badge: "https://800147.github.io/tests/img/favicon_72.png",
      icon: "https://800147.github.io/tests/img/favicon_72.png",
      silent: false,
      data: { url },
      actions: [
        {
          action: url + "&fromAction=1",
          title: "action",
          icon: "https://800147.github.io/tests/img/favicon_72.png",
        },
        {
          action: "https://ya.ru",
          title: "ya",
          icon: "https://800147.github.io/tests/img/favicon_72.png",
        },
      ],
      body: text,
    });
  } catch (e) {
    console.error("can't notify");
  }
};

self.addEventListener("install", (event) => {
  // self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", async (event) => {
  const { action, payload } = event.data;

  switch (action) {
    case "NOTIFY":
      event.waitUntil(notify(payload));
      break;
  }
});

self.addEventListener("notificationclick", (event) => {
  event.preventDefault();

  if (!event.notification.data?.url) {
    return;
  }

  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.action || event.notification.data.url),
  );
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
