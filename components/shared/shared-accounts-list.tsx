"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UsersRound, Plus, Link2, Copy, Check } from "lucide-react";
import type { SharedAccount } from "@/lib/database.types";
import {
  createSharedAccount,
  createInvite,
  leaveSharedAccount,
  deleteSharedAccount,
  joinSharedAccount,
  getMySharedAccounts,
} from "@/app/actions/shared-accounts";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

type Props = { initialAccounts: SharedAccount[] };

export function SharedAccountsList({ initialAccounts }: Props) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<{ accountName: string; link: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function getUsr() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    getUsr();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    const result = await createSharedAccount(newName.trim());
    setCreateLoading(false);

    if (result.error) {
      setCreateError(result.error);
      return;
    }

    setCreateOpen(false);
    setNewName("");
    router.refresh();

    // Show invite dialog immediately
    if (result.data) {
      const inviteResult = await createInvite(result.data.id, typeof window !== "undefined" ? window.location.origin : undefined);
      if (inviteResult.link) {
        setInviteLink({
          accountName: result.data.name,
          link: inviteResult.link,
          code: result.data.invite_code
        });
      }
    }

    const { data } = await getMySharedAccounts();
    if (data) setAccounts(data);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setJoinLoading(true);
    const result = await joinSharedAccount(joinCode.trim().toUpperCase());
    setJoinLoading(false);
    if (result.error) {
      setJoinError(result.error);
      return;
    }
    setJoinOpen(false);
    setJoinCode("");
    router.refresh();
    const { data } = await getMySharedAccounts();
    if (data) setAccounts(data);
  }

  async function handleInvite(account: SharedAccount) {
    const result = await createInvite(account.id, typeof window !== "undefined" ? window.location.origin : undefined);
    if (result.error) return;
    if (result.link) setInviteLink({ accountName: account.name, link: result.link, code: account.invite_code });
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave(accountId: string) {
    if (!confirm("¿Salir de esta cuenta compartida? Podrás volver a unirte si alguien te invita.")) return;
    const result = await leaveSharedAccount(accountId);
    if (result.error) return;
    router.refresh();
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  }

  async function handleDelete(accountId: string) {
    if (!confirm("¿ESTÁS SEGURO? Esto eliminará la cuenta para TODOS los miembros. No se puede deshacer.")) return;
    const result = await deleteSharedAccount(accountId);
    if (result.error) return alert(result.error);
    router.refresh();
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {accounts.length === 0
            ? "Aún no tienes cuentas compartidas."
            : `${accounts.length} cuenta(s) compartida(s).`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinOpen(true)} className="gap-2">
            Unirse con código
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear cuenta compartida
          </Button>
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => {
            const isPending = (account.member_count ?? 0) < 2;
            return (
              <Card key={account.id} className={isPending ? "border-dashed opacity-80" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UsersRound className="h-4 w-4" />
                    {account.name}
                    {isPending && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        PENDIENTE
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPending && (
                    <p className="text-xs text-amber-600">
                      Esta cuenta necesita al menos 2 miembros para estar activa. Comparte el código para que alguien se una.
                    </p>
                  )}
                  <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase text-muted-foreground">Código de invitación</p>
                      <p className="font-mono text-sm font-bold tracking-widest">{account.invite_code}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyText(account.invite_code)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleInvite(account)}
                    >
                      <Link2 className="h-4 w-4" />
                      Enlace
                    </Button>
                    {currentUserId === account.created_by ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(account.id)}
                      >
                        Eliminar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleLeave(account.id)}
                      >
                        Salir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog for Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta compartida</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                {createError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Casa, Viajes..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "Creando…" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Join */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unirse a cuenta compartida</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJoin} className="space-y-4">
            {joinError && (
              <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                {joinError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="joinCode">Código de la cuenta</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Ej. ABC123"
                className="text-center font-mono text-lg uppercase tracking-widest"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setJoinOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={joinLoading}>
                {joinLoading ? "Uniéndose…" : "Unirse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Invite Link */}
      <Dialog open={!!inviteLink} onOpenChange={(open) => !open && setInviteLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitación — {inviteLink?.accountName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Código de invitación</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink?.code ?? ""} className="font-mono text-sm uppercase tracking-widest" />
                <Button variant="outline" size="icon" onClick={() => copyText(inviteLink?.code ?? "")}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Enlace de invitación</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink?.link ?? ""} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copyText(inviteLink?.link ?? "")}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              El enlace expira en 7 días. La otra persona puede unirse usando el enlace o el código.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setInviteLink(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
