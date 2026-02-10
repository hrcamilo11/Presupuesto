import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AcceptInviteForm } from "@/components/shared/accept-invite-form";
import { Button } from "@/components/ui/button";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function InvitePage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="mx-auto max-w-md space-y-4 rounded-lg border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Enlace inválido</h1>
          <p className="text-sm text-muted-foreground">
            Falta el código de invitación. Usa el enlace que te enviaron.
          </p>
          <Button asChild>
            <Link href="/login">Ir a iniciar sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/invite?token=" + token)}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto max-w-md space-y-4 rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold">Unirse a una cuenta compartida</h1>
        <AcceptInviteForm token={token} />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Volver al dashboard</Link>
        </p>
      </div>
    </div>
  );
}
