"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Share, Smartphone, X } from "lucide-react";

const PWA_INSTALL_DISMISSED_KEY = "pwa-install-dismissed";

/** Detecta el tipo de navegador para mostrar instrucciones de instalación adecuadas. */
function getBrowserHint(): "ios" | "android-firefox" | "android-chromium" | "desktop" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) && !(typeof window !== "undefined" && (window as unknown as { MSStream?: boolean }).MSStream);
  if (ios) return "ios";
  const android = /Android/.test(ua);
  if (android) {
    if (/Firefox|FxiOS/.test(ua)) return "android-firefox";
    return "android-chromium"; // Chrome, Edge, Samsung Internet, Opera, etc.
  }
  return "desktop";
}

/** Llamar desde Configuración para volver a mostrar el diálogo de instalación (Android) o instrucciones (iOS). */
export function requestInstallPrompt(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
  window.dispatchEvent(new CustomEvent("pwa-request-install-prompt"));
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [requestedFromSettings, setRequestedFromSettings] = useState(false);
  const [installRequestCount, setInstallRequestCount] = useState(0);
  const [browserHint, setBrowserHint] = useState<ReturnType<typeof getBrowserHint>>(null);
  const autoPromptDone = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);
    if (standalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIOS(ios);
    setBrowserHint(getBrowserHint());

    const handler = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setDeferredPrompt(ev);
      // Instalación automática: mostrar el diálogo del sistema en cuanto el navegador lo permita (Android).
      if (!autoPromptDone.current) {
        autoPromptDone.current = true;
        ev.prompt()
          .then(() => ev.userChoice)
          .then(({ outcome }) => {
            if (outcome === "dismissed") setShowFallbackBanner(true);
          })
          .catch(() => setShowFallbackBanner(true));
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    const requestHandler = () => {
      localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
      setRequestedFromSettings(true);
      setInstallRequestCount((c) => c + 1);
    };
    window.addEventListener("pwa-request-install-prompt", requestHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("pwa-request-install-prompt", requestHandler);
    };
  }, [mounted]);

  // Cuando piden desde Configuración y ya tenemos el evento (Android), mostrar el diálogo del sistema
  useEffect(() => {
    if (installRequestCount === 0 || !deferredPrompt || isIOS) return;
    deferredPrompt.prompt().catch(() => {});
  }, [installRequestCount, deferredPrompt, isIOS]);

  const handleInstallAgain = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt().catch(() => {});
      setShowFallbackBanner(false);
    }
  };

  const handleDismissBanner = () => {
    setShowFallbackBanner(false);
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, String(Date.now()));
  };

  // No mostrar nada si ya está instalado
  if (!mounted || isStandalone) return null;

  // Android: solo mostrar banner de respaldo si el usuario cerró el diálogo del sistema y no lo ha descartado
  const stored = typeof window !== "undefined" ? localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) : null;
  const dismissed = stored ? (Date.now() - Number(stored) < 7 * 24 * 60 * 60 * 1000) : false;
  if (!isIOS && !showFallbackBanner && !requestedFromSettings) return null;
  if (!isIOS && dismissed && !requestedFromSettings) return null;

  // iOS: solo mostrar si pidieron instrucciones desde Configuración
  if (isIOS && !requestedFromSettings) return null;

  // Banner mínimo: solo cuando (1) Android y cerraron el diálogo, o (2) pidieron desde Configuración (iOS o escritorio)
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:rounded-lg sm:border pb-[env(safe-area-inset-bottom)] sm:pb-3"
      role="dialog"
      aria-label="Instalar aplicación"
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="h-4 w-4 shrink-0" />
            Instalar app
          </p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground">
              En iPhone o iPad (Safari, Chrome, Firefox, Edge): <Share className="inline h-3 w-3" /> <strong>Compartir</strong> → &quot;Añadir a la pantalla de inicio&quot;.
            </p>
          ) : requestedFromSettings && !deferredPrompt ? (
            <p className="text-xs text-muted-foreground space-y-1">
              {browserHint === "android-firefox" && (
                <>En <strong>Firefox</strong>: menú (⋮) → &quot;Instalar&quot; o &quot;Añadir a la pantalla de inicio&quot;.</>
              )}
              {browserHint === "android-chromium" && (
                <>En Chrome, Edge o Samsung Internet el diálogo puede aparecer al cargar. Si no: menú (⋮) → &quot;Instalar app&quot; o &quot;Añadir a la pantalla de inicio&quot;.</>
              )}
              {browserHint === "desktop" && (
                <>Abre esta página en el <strong>navegador de tu móvil</strong> (Chrome, Firefox, Safari, Edge) y usa el menú del navegador para instalar o añadir a la pantalla de inicio.</>
              )}
              {!browserHint && (
                <>Abre esta página en tu teléfono y usa el menú del navegador → Instalar / Añadir a la pantalla de inicio.</>
              )}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                ¿Instalar Presupuesto en la pantalla de inicio?
              </p>
              <Button size="sm" onClick={handleInstallAgain} className="w-fit">
                Instalar
              </Button>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleDismissBanner} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
