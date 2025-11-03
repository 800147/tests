import { fromBase64Url } from "../node_modules/web-push-browser/build/index.js";
import { generateVAPIDKeys } from "./helpers/vapid.js";

let vapidKeys;

const notificationsPermissionCheck = async () => {
  const update = () => {
    if (Notification.permission === "granted") {
      document.body.classList.add("Notifications_granted");
    } else {
      document.body.classList.remove("Notifications_granted");
    }
  };

  const notificationsPermissionQuery = await navigator.permissions.query({
    name: "notifications",
  });

  update();

  notificationsPermissionQuery.addEventListener("change", update);

  allowNotificationsButton.addEventListener("click", () =>
    Notification.requestPermission().then(() => update()),
  );
};

const updateSubscribtionState = async () => {
  const { pushManager } = (await navigator.serviceWorker?.ready) ?? {};

  if (await pushManager.getSubscription()) {
    document.body.classList.add("Push_subscribed");
    document.body.classList.remove("Push_unsubscribed");
  } else {
    document.body.classList.remove("Push_subscribed");
    document.body.classList.add("Push_unsubscribed");
  }
};

subscribePushButton.addEventListener("click", async () => {
  if (!("PushManager" in window)) {
    console.error("No PushManager support");

    return;
  }

  // В настоящем приложении vapid ключи должны генерироваться
  // на сервере и на фронт должна приходить только публичная часть.
  // В этой демке это допущение делается для простоты реализации
  vapidKeys = await generateVAPIDKeys();

  const { pushManager } = (await navigator.serviceWorker?.ready) ?? {};

  const state = await checkPushManagerState(pushManager);

  if (state !== "prompt" && state !== "granted") {
    return;
  }

  await subscribeToPush();

  updateSubscribtionState();
});

unsubscribePushButton.addEventListener("click", async () => {
  const { pushManager } = (await navigator.serviceWorker?.ready) ?? {};

  await (await pushManager.getSubscription()).unsubscribe();

  updateSubscribtionState();
});

const swInit = async () => {
  if (!("serviceWorker" in navigator)) {
    console.error("serviceWorker not awailable");

    return;
  }

  try {
    const scope = location.pathname.replace(/\/[^/]*$/, "/");
    const { active } = await navigator.serviceWorker.register(`${scope}sw.js`, {
      scope,
    });

    updateSubscribtionState();

    [...document.querySelectorAll(".NotifyButtonFigure button")].map((button) =>
      button.addEventListener("click", (event) => {
        active.postMessage({
          action: "NOTIFY",
          payload: {
            delay: Number(event.target.dataset.delay) * 1000,
            text: `${event.target.dataset.delay} seconds have passed`,
            url: "./message.html?t=It's time!",
          },
        });
      }),
    );
  } catch (error) {
    console.error("Registration failed with error:\n" + error);
  }
};

notificationsPermissionCheck();
swInit();

const checkPushManagerState = async (pushManager) => {
  if (!pushManager) {
    console.error("pushManager is not available");

    return "error";
  }

  const permissionState = await pushManager.permissionState({
    userVisibleOnly: true,
  });

  if (permissionState !== "granted") {
    return permissionState; // 'prompt' | 'denied'
  }

  try {
    const existingSubscription = await pushManager.getSubscription();

    if (existingSubscription) {
      await sendSubscriptionToServer(existingSubscription);
    }

    return "granted";
  } catch (e) {
    console.error("Subscription error:", e);

    return "error";
  }
};

async function subscribeToPush() {
  if (!vapidKeys.publicKey) {
    console.error("VAPID key is not configured");
    return;
  }

  try {
    const { pushManager } = (await navigator.serviceWorker?.ready) ?? {};

    if (!pushManager) {
      return;
    }

    const subscription = await pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: fromBase64Url(vapidKeys.publicKey),
    });

    await sendSubscriptionToServer(subscription);
    return true;
  } catch (error) {
    console.error("Push subscription error:", error);
    return false;
  }
}

async function sendSubscriptionToServer(subscription) {
  try {
    const subscriptionJson = subscription.toJSON();

    if (
      !subscriptionJson.keys?.p256dh ||
      !subscriptionJson.keys?.auth ||
      !subscriptionJson.endpoint
    ) {
      throw new Error("Отсутствуют необходимые данные подписки");
    }

    const subscriptionInfo = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
        // В настоящем приложении приватный ключ должен генерироваться
        // и храниться только на сервере. В этой демке это допущение
        // делается для простоты реализации
        privateKey: vapidKeys.privateKey,
        publicKey: vapidKeys.publicKey,
      },
    };

    const controllerUrl = `${location.origin === "https://800147.github.io" ? "https://800147.github.io/tests" : location.origin}/notifications-sender/?si=${encodeURIComponent(JSON.stringify(subscriptionInfo))}`;

    controllerPlace.innerHTML = `<h2>Controller link</h2>
      <p>
      <a href="${controllerUrl}" target="_blank">Controller</a> | <a href="http://qrcoder.ru/code/?${encodeURIComponent(controllerUrl)}&4&1" target="_blank">QR</a>
      </p>`;
  } catch (error) {
    console.error("Server subscription error:", error);
    throw error;
  }
}
