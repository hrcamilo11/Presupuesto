import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/notifications/send-email";
import { sendPushNotification, isPushConfigured } from "@/lib/notifications/push";
import type { NotificationType } from "@/lib/database.types";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

/**
 * Crea una notificación para cualquier usuario (usa service role) y envía email/push según sus preferencias.
 * Usar para notificar a otros usuarios (ej. dueño de cuenta cuando alguien se une).
 */
export async function createNotificationForUser(params: {
  userId: string;
  title: string;
  body?: string | null;
  type?: NotificationType;
  link?: string | null;
}): Promise<{ id: string | null; error: string | null }> {
  try {
    const admin = createAdminClient();
    const { data: inserted, error: insertError } = await admin
      .from("notifications")
      .insert({
        user_id: params.userId,
        title: params.title,
        body: params.body ?? null,
        type: params.type ?? "info",
        link: params.link ?? null,
        metadata: {},
      })
      .select("id")
      .single();

    if (insertError) return { id: null, error: insertError.message };

    const linkUrl = params.link
      ? (appUrl ? `${appUrl}${params.link}` : params.link)
      : appUrl ? `${appUrl}/notifications` : null;

    const { data: authUser } = await admin.auth.admin.getUserById(params.userId);
    const email = authUser?.user?.email ?? null;

    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("email_enabled, push_enabled")
      .eq("user_id", params.userId)
      .single();

    if (prefs?.email_enabled !== false && email) {
      await sendNotificationEmail({
        to: email,
        subject: params.title,
        body: params.body ?? params.title,
        link: linkUrl,
      });
    }

    if (prefs?.push_enabled !== false && isPushConfigured()) {
      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("endpoint, p256dh_key, auth_key")
        .eq("user_id", params.userId);
      if (subs?.length) {
        const payload = {
          title: params.title,
          body: params.body ?? undefined,
          url: linkUrl ?? undefined,
        };
        for (const sub of subs) {
          await sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
            payload
          );
        }
      }
    }

    return { id: inserted?.id ?? null, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { id: null, error: msg };
  }
}
