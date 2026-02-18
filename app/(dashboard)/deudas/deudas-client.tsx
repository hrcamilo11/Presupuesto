"use client";

import { useState, useTransition } from "react";

import { ArrowDownLeft, Check, X, Loader2, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { respondToCollection, createCollection } from "@/app/actions/collections";
import type { Collection, Profile, CollectionPayment } from "@/lib/database.types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DeudasClientProps {
    initialDebts: (Collection & { creditor: Profile | null, payments: CollectionPayment[] })[];
    friends: { friendship_id: string, profile: Profile }[];
}

export function DeudasClient({ initialDebts, friends }: DeudasClientProps) {
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state for new debt
    const [selectedFriendId, setSelectedFriendId] = useState<string>("manual");
    const [creditorName, setCreditorName] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    function handleResponse(collectionId: string, accept: boolean) {
        startTransition(async () => {
            const { error } = await respondToCollection(collectionId, accept);
            if (error) {
                setMsg(error);
            } else {
                setMsg(accept ? "Deuda aceptada." : "Deuda rechazada.");
            }
        });
    }

    function handleCreate() {
        if (selectedFriendId !== "manual" && !selectedFriendId) return;
        if (selectedFriendId === "manual" && !creditorName) return;
        if (!amount) return;

        startTransition(async () => {
            const finalCreditorId = selectedFriendId === "manual" ? null : selectedFriendId;
            const { error } = await createCollection(null, parseFloat(amount), 'COP', description, undefined, finalCreditorId, creditorName);
            if (error) {
                setMsg(error);
            } else {
                setMsg(finalCreditorId ? "Deuda registrada y enviada al amigo." : "Deuda manual registrada.");
                setIsDialogOpen(false);
                setSelectedFriendId("manual");
                setCreditorName("");
                setAmount("");
                setDescription("");
            }
        });
    }

    const calculateBalance = (collection: Collection & { payments: CollectionPayment[] }) => {
        const totalPaid = (collection.payments || []).reduce((acc, p) => acc + Number(p.amount), 0);
        return collection.amount - totalPaid;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_approval': return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Por Aprobar</span>;
            case 'active': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Activa</span>;
            case 'partially_paid': return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Pago Parcial</span>;
            case 'paid': return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Pagada</span>;
            case 'rejected': return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Rechazada</span>;
            case 'cancelled': return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Cancelada</span>;
            default: return null;
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 md:px-8">
            <header className="flex items-center justify-between border-b border-border/80 pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ArrowDownLeft className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Deudas</h1>
                        <p className="text-sm text-muted-foreground">
                            Dinero que le debes a otras personas.
                        </p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nueva Deuda
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar nueva deuda</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Acreedor (Quién te prestó)</Label>
                                <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un amigo o registro manual" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Registro manual (Persona sin cuenta)</SelectItem>
                                        {friends.map(f => (
                                            <SelectItem key={f.profile.id} value={f.profile.id}>
                                                {f.profile.full_name || f.profile.username} (@{f.profile.username})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedFriendId === "manual" && (
                                <div className="space-y-2">
                                    <Label htmlFor="creditorName">Nombre del acreedor</Label>
                                    <Input
                                        id="creditorName"
                                        placeholder="Ej: Banco o Nombre de persona"
                                        value={creditorName}
                                        onChange={(e) => setCreditorName(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Monto</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción (opcional)</Label>
                                <Input
                                    id="description"
                                    placeholder="¿Por qué te prestaron este dinero?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleCreate} disabled={isPending || (selectedFriendId === 'manual' && !creditorName) || (selectedFriendId !== 'manual' && !selectedFriendId) || !amount}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar Deuda"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </header>

            {msg && (
                <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary flex justify-between items-center text-center">
                    {msg}
                    <Button variant="ghost" size="sm" onClick={() => setMsg(null)}><X className="h-4 w-4" /></Button>
                </div>
            )}

            <div className="grid gap-4">
                {initialDebts.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            No tienes deudas registradas.
                        </CardContent>
                    </Card>
                ) : (
                    initialDebts.map((d) => {
                        const balance = calculateBalance(d);
                        // Check if I am the debtor and need to approve a cobro initiated by someone else
                        const needsMyApproval = d.status === 'pending_approval' && d.debtor_id !== null;

                        return (
                            <Card key={d.id} className={cn(
                                needsMyApproval && "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-md",
                                d.status === 'pending_approval' && !needsMyApproval && "opacity-75 border-dashed"
                            )}>
                                <CardContent className="py-5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                                <User className="h-5 w-5 text-destructive" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-lg leading-none">
                                                        {d.creditor ? (d.creditor.full_name || d.creditor.username) : (d.creditor_name || "Desconocido")}
                                                    </p>
                                                    {getStatusBadge(d.status)}
                                                </div>
                                                <p className="text-sm text-muted-foreground font-medium">
                                                    {d.description || "Sin descripción"}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>{format(new Date(d.created_at), "d 'de' MMMM", { locale: es })}</span>
                                                    {d.status === 'partially_paid' && (
                                                        <span className="text-destructive font-medium">
                                                            {d.payments.length} abonos registrados
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-destructive">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: d.currency }).format(d.amount)}
                                                </p>
                                                {balance < d.amount && balance > 0 && (
                                                    <p className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                        Pendiente: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: d.currency }).format(balance)}
                                                    </p>
                                                )}
                                            </div>

                                            {needsMyApproval ? (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                                                        onClick={() => handleResponse(d.id, true)}
                                                        disabled={isPending}
                                                    >
                                                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                                                        Aceptar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleResponse(d.id, false)}
                                                        disabled={isPending}
                                                    >
                                                        <X className="h-3.5 w-3.5 mr-1" />
                                                        Rechazar
                                                    </Button>
                                                </div>
                                            ) : (
                                                d.status === 'pending_approval' && (
                                                    <p className="text-xs italic text-muted-foreground">Esperando aprobación del acreedor...</p>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment History Miniature */}
                                    {d.payments.length > 0 && (
                                        <div className="mt-4 pt-4 border-t space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Historial de abonos</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {d.payments.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md text-xs border border-border/50">
                                                        <div>
                                                            <span className="font-bold text-destructive">
                                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: d.currency }).format(p.amount)}
                                                            </span>
                                                            <span className="text-muted-foreground ml-2">
                                                                {format(new Date(p.date), "dd/MM/yy")}
                                                            </span>
                                                        </div>
                                                        {p.notes && <span className="text-muted-foreground italic truncate max-w-[80px]" title={p.notes}>{p.notes}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
