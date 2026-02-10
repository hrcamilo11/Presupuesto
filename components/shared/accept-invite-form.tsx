"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/app/actions/shared-accounts";

type Props = { token: string };

export function AcceptInviteForm({ token }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAccept() {
    setError(null);
    setLoading(true);
    const result = await acceptInvite(token);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  if (success) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-green-600 dark:text-green-400">
          Te has unido correctamente a la cuenta compartida.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard">Ir al dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shared">Ver cuentas compartidas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Acepta la invitación para ver y editar los datos de esta cuenta compartida.
      </p>
      {error && (
        <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
      )}
      <Button onClick={handleAccept} disabled={loading} className="w-full">
        {loading ? "Uniendo…" : "Aceptar invitación"}
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/dashboard">Cancelar</Link>
      </Button>
    </div>
  );
}
