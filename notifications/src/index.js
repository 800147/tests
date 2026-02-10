import { generateVAPIDKeys, fromBase64Url } from "./helpers/vapid.js";

let vapidKeys;

const notificationsPermissionCheck = async () => {
  const update = () => {
    if (Notification.permission === "granted") {
      document.body.classList.add("Notifications_granted");

      return;
    }

    if (Notification.permission === "denied") {
      console.error("Notifications permission", Notification.permission);
    }

    document.body.classList.remove("Notifications_granted");
  };

  allowNotificationsButton.addEventListener("click", () => {
    console.log("requesting permissions...");
    Notification.requestPermission().then(
      (res) => {
        console.log("requestPermission success", res);
        update();
      }
    ).catch(console.error);
  });

  const notificationsPermissionQuery = await navigator.permissions.query({
    name: "notifications",
  });

  update();

  notificationsPermissionQuery.addEventListener("change", update);
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
    console.error(`Bad pushManager state: ${state}`);

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
    console.error("serviceWorker not available");

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
        const buttonDataset = event.target.dataset ?? {};

        if (buttonDataset.inTab) {
          const date = new Date();
          new Notification("Notification", {
            body: `Notification from tab ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
            data: { url: "./message.html?t=It's time!" },
            tag: buttonDataset.tag,
          });

          return;
        }

        active.postMessage({
          action: "NOTIFY",
          payload: {
            delay: Number(buttonDataset.delay) * 1000,
            text: `${buttonDataset.delay} seconds have passed`,
            url: "./message.html?t=It's time!",
          },
        });
      }),
    );
  } catch (error) {
    console.error("Registration failed with error:\n" + error);
  }
};
const print = (v) => {
  switch (typeof v) {
    case "function":
      return "[function]";
    case "string":
      return `"${v}"`;
    default:
      return String(v);
  }
};

const writeStatus = () => {
  statusSection.innerText = `Notification: ${print(Notification)}
Notification?.permission: ${print(Notification?.permission)}
Notification?.requestPermission: ${print(Notification?.requestPermission)}
"PushManager" in window: ${print("PushManager" in window)}
navigator.serviceWorker: ${print(navigator.serviceWorker)}
`;
};

writeStatus();
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
    const ready = (await navigator.serviceWorker?.ready) ?? {};
    const { pushManager } = ready;

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
