"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Share, Smartphone } from "lucide-react";

const PWA_INSTALL_DISMISSED_KEY = "pwa-install-dismissed";

/** Llamar desde Configuración para volver a mostrar el banner de instalación. */
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
  const [dismissed, setDismissed] = useState(true);
  const [requestedFromSettings, setRequestedFromSettings] = useState(false);

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

    const stored = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && Date.now() - parsed < 7 * 24 * 60 * 60 * 1000) setDismissed(true);
      else setDismissed(false);
    } else {
      setDismissed(false);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const requestHandler = () => {
      localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
      setDismissed(false);
      setRequestedFromSettings(true);
    };
    window.addEventListener("pwa-request-install-prompt", requestHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("pwa-request-install-prompt", requestHandler);
    };
  }, [mounted]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, String(Date.now()));
  };

  if (!mounted || isStandalone || dismissed) return null;
  if (!isIOS && !deferredPrompt && !requestedFromSettings) return null;

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
              Para instalar: usa el botón <Share className="inline h-3 w-3" /> Compartir y luego &quot;Añadir a la pantalla de inicio&quot;.
            </p>
          ) : requestedFromSettings && !deferredPrompt ? (
            <p className="text-xs text-muted-foreground">
              Abre esta página en el navegador de tu teléfono (Chrome en Android o Safari en iPhone) y usa el menú del navegador para instalar o añadir a la pantalla de inicio.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Instala Presupuesto en tu dispositivo para acceder más rápido.
            </p>
          )}
          {!isIOS && deferredPrompt && (
            <Button size="sm" onClick={handleInstall} className="w-fit">
              Instalar
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleDismiss} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
