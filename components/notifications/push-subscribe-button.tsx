"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Bell } from "lucide-react";
import { getPushPublicKey, savePushSubscription } from "@/app/actions/notifications";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function PushSubscribeButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubscribe() {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Tu navegador no soporta notificaciones push.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Permiso de notificaciones denegado.");
        setStatus("error");
        return;
      }

      const { key, error: keyError } = await getPushPublicKey();
      if (keyError || !key) {
        setMessage(keyError || "Push no configurado en el servidor.");
        setStatus("error");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await registration.update();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });

      const subJson = subscription.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
      let p256dh: string;
      let auth: string;
      if (subJson.keys?.p256dh && subJson.keys?.auth) {
        p256dh = subJson.keys.p256dh;
        auth = subJson.keys.auth;
      } else {
        p256dh = arrayBufferToBase64((await subscription.getKey("p256dh")) as ArrayBuffer);
        auth = arrayBufferToBase64((await subscription.getKey("auth")) as ArrayBuffer);
      }

      await savePushSubscription({
        endpoint: subscription.endpoint,
        keys: { p256dh, auth },
        user_agent: navigator.userAgent,
      });

      setMessage("Notificaciones push activadas en este dispositivo.");
      setStatus("ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSubscribe}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className="mr-2 h-4 w-4" />
        )}
        Activar notificaciones en este dispositivo
      </Button>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
