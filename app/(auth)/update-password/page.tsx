"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    
    // Procesar el hash del token de reset password si viene en la URL (#access_token=...&type=recovery)
    // Supabase procesa automáticamente el hash cuando llamamos getSession()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        // Hay sesión válida (el token de recovery fue procesado correctamente)
        setChecking(false);
        return;
      }
      
      // Si no hay sesión inmediatamente, verificar después de un breve delay
      // para dar tiempo a que Supabase procese el hash si existe
      setTimeout(async () => {
        if (!mounted) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // No hay usuario autenticado - el token puede haber expirado o ser inválido
          setChecking(false);
          router.replace("/login?error=reset_token_invalid");
        } else {
          setChecking(false);
        }
      }, 500);
    });
    
    // También escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setChecking(false);
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>
          Elige una contraseña nueva para tu cuenta.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando…" : "Guardar contraseña"}
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Volver a iniciar sesión
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
