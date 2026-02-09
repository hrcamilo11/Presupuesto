"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const errorCode = searchParams.get("error_code");
  const errorParam = searchParams.get("error");
  const otpExpired = errorCode === "otp_expired";
  const callbackFailed = errorParam === "auth_callback_failed";

  useEffect(() => {
    if (otpExpired) {
      setError("El enlace de confirmación ha caducado. Solicita uno nuevo abajo.");
    } else if (callbackFailed) {
      setError("No se pudo completar el acceso. Vuelve a intentar o inicia sesión con tu contraseña.");
    }
  }, [otpExpired, callbackFailed]);

  async function handleResendConfirmation() {
    const e = email.trim();
    if (!e) {
      setError("Escribe tu correo para reenviar el enlace.");
      return;
    }
    setError(null);
    setResendLoading(true);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: e,
    });
    setResendLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setResendSent(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresa tu correo y contraseña para acceder a tu presupuesto.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}
          {resendSent && (
            <p className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 p-3 rounded-md">
              Revisa tu correo: te hemos enviado un nuevo enlace de confirmación.
            </p>
          )}
          {otpExpired && (
            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 space-y-2">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                El enlace de activación ya no es válido. Introduce tu correo y pulsa
                &quot;Reenviar enlace&quot; para recibir uno nuevo.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
              >
                {resendLoading ? "Enviando…" : "Reenviar enlace de confirmación"}
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center text-muted-foreground">
            Cargando…
          </CardContent>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
