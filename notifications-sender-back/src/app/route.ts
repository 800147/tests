import { NextRequest } from "next/server";
import { sendPushNotification, deserializeVapidKeys } from "web-push-browser";

export async function POST(req: NextRequest) {
  const data = (await req.json()) as {
    text: string;
    url: string;
    subscriptionInfo: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
        privateKey: string;
        publicKey: string;
      };
    };
  };

  console.log(data);

  const { text, url, subscriptionInfo } = data;

  const keyPair = await deserializeVapidKeys({
    publicKey: subscriptionInfo.keys.publicKey,
    privateKey: subscriptionInfo.keys.privateKey,
  });

  const { auth, p256dh } = subscriptionInfo.keys;

  const res = await sendPushNotification(
    keyPair,
    {
      endpoint: subscriptionInfo.endpoint,
      keys: { auth, p256dh },
    },
    "support@website.com",
    JSON.stringify({
      text,
      url,
    }),
  );

  if (!res.ok) {
    throw new Error("not ok");
  }

  return new Response();
}
