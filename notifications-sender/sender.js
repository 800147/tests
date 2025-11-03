import {
  sendPushNotification,
  deserializeVapidKeys,
} from "../notifications/node_modules/web-push-browser/build/index.js";

const getUrlParams = (parsers) =>
  Object.fromEntries(
    Array.from(new URLSearchParams(window.location.search).entries()).map(
      ([key, value]) => [key, parsers?.[key] ? parsers[key](value) : value],
    ),
  );

const subscriptionInfo = JSON.parse(getUrlParams().si);

if (
  subscriptionInfo.endpoint.startsWith(
    "https://updates.push.services.mozilla.com",
  )
) {
  // Firefox разрешает обращаться к push-серверу из браузера,
  // поэтому отправлять запрос с бэка не надо
  sendFromBackCheckbox.checked = false;
} else {
  sendFromBackCheckbox.checked = true;
}

sendButton.addEventListener("click", async () => {
  const keyPair = await deserializeVapidKeys({
    publicKey: subscriptionInfo.keys.publicKey,
    privateKey: subscriptionInfo.keys.privateKey,
  });

  const { auth, p256dh } = subscriptionInfo.keys;

  const text = input.value || "hello";
  const url = `./message.html?t=${encodeURIComponent(text)}`;

  let res;

  if (sendFromBackCheckbox.checked) {
    res = await fetch("http://localhost:3000", {
      method: "POST",
      body: JSON.stringify({
        text,
        url,
        subscriptionInfo,
      }),
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
    });
  } else {
    res = await sendPushNotification(
      keyPair,
      {
        endpoint: subscriptionInfo.endpoint,
        keys: { auth, p256dh },
      },
      "support@website.com",
      JSON.stringify({ text, url }),
    );
  }

  if (!res.ok) {
    console.error("Failed to send push notification", res);
  }
});
