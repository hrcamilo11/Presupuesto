"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Notification, NotificationPreferences } from "@/lib/database.types";
import type { NotificationType } from "@/lib/database.types";
import { sendEmail, sendNotificationEmail } from "@/lib/notifications/send-email";
import { sendPushNotification, isPushConfigured, getVapidPublicKey } from "@/lib/notifications/push";

const NOTIFICATIONS_PAGE = "/notifications";

export async function getNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "No autenticado" };

  let q = supabase
    .from("notifications")
    .select("id, title, body, type, link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.unreadOnly) {
    q = q.is("read_at", null);
  }

  const { data, error } = await q;
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Notification[], error: null };
}

export async function getUnreadCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { count: 0, error: "No autenticado" };

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { count: 0, error: error.message };
  return { count: count ?? 0, error: null };
}

export async function markAsRead(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(NOTIFICATIONS_PAGE);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };
  revalidatePath(NOTIFICATIONS_PAGE);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function getNotificationPreferences() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autenticado" };

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: null };
    }
    return { data: null, error: error.message };
  }
  return { data: data as NotificationPreferences, error: null };
}

export async function updateNotificationPreferences(input: {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error: upsertError } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        ...input,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) return { error: upsertError.message };
  revalidatePath("/settings");
  return { error: null };
}

/** Envía un correo de prueba al usuario actual (para verificar Resend). */
export async function sendTestEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "No autenticado o sin correo" };

  return sendEmail({
    to: user.email,
    subject: "Hello World",
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  });
}

export async function getPushPublicKey(): Promise<{ key: string | null; error: string | null }> {
  const key = getVapidPublicKey();
  return { key, error: key ? null : "Push no configurado (VAPID_PUBLIC_KEY)" };
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  user_agent?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: subscription.user_agent ?? null,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) return { error: error.message };
  return { error: null };
}

export type CreateNotificationInput = {
  userId: string;
  title: string;
  body?: string | null;
  type?: NotificationType;
  link?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Crea una notificación in-app. Por RLS solo se puede crear para el usuario actual.
 * Para notificar a otro usuario (ej. invitación) usar service role en ese flujo.
 */
export async function createNotification(input: CreateNotificationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "No autenticado" };
  if (input.userId !== user.id) return { id: null, error: "Solo puedes crear notificaciones para ti" };

  const { data: inserted, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      title: input.title,
      body: input.body ?? null,
      type: input.type ?? "info",
      link: input.link ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  const prefs = await getNotificationPreferences();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const linkUrl = input.link
    ? (appUrl ? `${appUrl}${input.link}` : input.link)
    : appUrl ? `${appUrl}/notifications` : null;

  if (
    prefs.data?.email_enabled !== false &&
    user.email
  ) {
    await sendNotificationEmail({
      to: user.email,
      subject: input.title,
      body: input.body ?? input.title,
      link: linkUrl,
    });
  }

  if (
    prefs.data?.push_enabled !== false &&
    isPushConfigured()
  ) {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh_key, auth_key")
      .eq("user_id", user.id);
    if (subscriptions?.length) {
      const payload = {
        title: input.title,
        body: input.body ?? undefined,
        url: linkUrl ?? undefined,
      };
      for (const sub of subscriptions) {
        await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
          },
          payload
        );
      }
    }
  }

  revalidatePath(NOTIFICATIONS_PAGE);
  revalidatePath("/dashboard");
  return { id: inserted?.id ?? null, error: null };
}
