import webpush from "web-push";

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

export function isPushConfigured(): boolean {
  return Boolean(vapidPublic && vapidPrivate);
}

export function getVapidPublicKey(): string | null {
  return vapidPublic ?? null;
}

export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  payload: { title: string; body?: string; url?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!vapidPublic || !vapidPrivate) {
    return { ok: false, error: "VAPID no configurado" };
  }

  webpush.setVapidDetails(
    "mailto:notificaciones@presupuesto.cfd",
    vapidPublic,
    vapidPrivate
  );

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 86400 }
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
