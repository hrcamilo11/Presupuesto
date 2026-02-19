"use client";

import { useState, useTransition, useEffect } from "react";
import { ArrowUpRight, Plus, Check, X, Loader2, User, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCollection, markCollectionAsPaid, addCollectionPayment, allocateCollectionPayment } from "@/app/actions/collections";
import type { Profile, Collection, CollectionPayment, Wallet } from "@/lib/database.types";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn, formatCurrency, formatCOP, parseCOP } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface CobrosClientProps {
    initialCollections: (Collection & { debtor: Profile | null, payments: CollectionPayment[] })[];
    friends: { friendship_id: string, profile: Profile }[];
    wallets: Wallet[];
}

export function CobrosClient({ initialCollections, friends, wallets }: CobrosClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const { toast } = useToast();

    // Form state
    // Form state for new cobro
    const [selectedFriendId, setSelectedFriendId] = useState<string>("manual");
    const [debtorName, setDebtorName] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    // Form state for payment (abono)
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<(Collection & { payments: CollectionPayment[] }) | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [paymentWalletId, setPaymentWalletId] = useState<string>("none");

    const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);

    // Allocation UI state
    const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<{ id: string, amount: number, collection: Collection } | null>(null);

    const searchParams = useSearchParams();

    // Effect to handle paymentId from notification link
    useEffect(() => {
        const paymentId = searchParams.get('paymentId');
        if (paymentId && initialCollections) {
            // Find the payment in any of the collections
            for (const col of initialCollections) {
                const p = col.payments?.find(p => p.id === paymentId);
                if (p && !p.creditor_income_id) {
                    setSelectedPayment({ id: p.id, amount: p.amount, collection: col });
                    setIsAllocationDialogOpen(true);
                    break;
                }
            }
        }
    }, [searchParams, initialCollections]);

    function handleCreate() {
        if (selectedFriendId !== "manual" && !selectedFriendId) return;
        if (selectedFriendId === "manual" && !debtorName) return;
        const numericAmount = parseFloat(parseCOP(amount));
        if (!numericAmount || numericAmount <= 0) return;

        startTransition(async () => {
            const finalDebtorId = selectedFriendId === "manual" ? null : selectedFriendId;
            const { error } = await createCollection(finalDebtorId, numericAmount, 'COP', description, debtorName);
            if (error) {
                setMsg(error);
            } else {
                setMsg(finalDebtorId ? "Cobro registrado y enviado al amigo." : "Cobro manual registrado.");
                setIsDialogOpen(false);
                setSelectedFriendId("manual");
                setDebtorName("");
                setAmount("");
                setDescription("");
                router.refresh();
            }
        });
    }

    function handleAddPayment() {
        if (!selectedCollection) return;
        const numericAmount = parseFloat(parseCOP(paymentAmount));
        if (!numericAmount || numericAmount <= 0) return;

        const balance = calculateBalance(selectedCollection);
        if (numericAmount > balance + 0.01) {
            toast({
                variant: "destructive",
                title: "Abono no permitido",
                description: `El pago de ${formatCurrency(numericAmount)} no es posible porque excede el saldo pendiente actual de ${formatCurrency(balance)}.`
            });
            return;
        }

        startTransition(async () => {
            const { error } = await addCollectionPayment(
                selectedCollection.id,
                numericAmount,
                paymentNotes,
                paymentWalletId === "none" ? undefined : paymentWalletId
            );
            if (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error
                });
            } else {
                toast({
                    title: "Transacción exitosa",
                    description: "Abono registrado correctamente."
                });
                setIsPaymentDialogOpen(false);
                setPaymentAmount("");
                setPaymentNotes("");
                setPaymentWalletId("none");
                setSelectedCollection(null);
                router.refresh();
            }
        });
    }

    function handleMarkAsPaid(collectionId: string) {
        startTransition(async () => {
            const { error } = await markCollectionAsPaid(
                collectionId,
                paymentWalletId === "none" ? undefined : paymentWalletId
            );
            if (error) {
                setMsg(error);
            } else {
                setMsg("Cobro marcado como pagado.");
                setIsMarkAsPaidDialogOpen(false);
                setPaymentWalletId("none");
                setSelectedCollection(null);
                router.refresh();
            }
        });
    }

    function handleAllocateMoney() {
        if (!selectedPayment || paymentWalletId === "none") return;

        startTransition(async () => {
            const { error } = await allocateCollectionPayment(selectedPayment.id, paymentWalletId);
            if (error) {
                setMsg(error);
            } else {
                setMsg("Dinero ubicado en la cuenta.");
                setIsAllocationDialogOpen(false);
                setPaymentWalletId("none");
                setSelectedPayment(null);
                router.refresh();
            }
        });
    }

    const calculateBalance = (collection: Collection & { payments: CollectionPayment[] }) => {
        const totalPaid = (collection.payments || []).reduce((acc, p) => acc + Number(p.amount), 0);
        return collection.amount - totalPaid;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_approval': return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pendiente</span>;
            case 'active': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Activo</span>;
            case 'paid': return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Pagado</span>;
            case 'rejected': return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Rechazado</span>;
            case 'cancelled': return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Cancelado</span>;
            default: return null;
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 md:px-8">
            <header className="flex items-center justify-between border-b border-border/80 pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ArrowUpRight className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cobros</h1>
                        <p className="text-sm text-muted-foreground">
                            Dinero que otras personas te deben.
                        </p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo Cobro
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar nuevo cobro</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Destinatario</Label>
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
                                    <Label htmlFor="debtorName">Nombre del deudor</Label>
                                    <Input
                                        id="debtorName"
                                        placeholder="Ej: Juan Pérez"
                                        value={debtorName}
                                        onChange={(e) => setDebtorName(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Monto</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        id="amount"
                                        placeholder="0"
                                        className="pl-7"
                                        value={amount}
                                        onChange={(e) => setAmount(formatCOP(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción (opcional)</Label>
                                <Input
                                    id="description"
                                    placeholder="¿Por qué te deben este dinero?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleCreate} disabled={isPending || (selectedFriendId === 'manual' && !debtorName) || (selectedFriendId !== 'manual' && !selectedFriendId) || !amount}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar Cobro"}
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
                {initialCollections.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            No tienes cobros registrados.
                        </CardContent>
                    </Card>
                ) : (
                    initialCollections.map((c) => {
                        const balance = calculateBalance(c);
                        return (
                            <Card key={c.id} className={cn(c.status === 'pending_approval' && "opacity-75 border-dashed")}>
                                <CardContent className="py-5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-lg leading-none">
                                                        {c.debtor ? (c.debtor.full_name || c.debtor.username) : (c.debtor_name || "Desconocido")}
                                                    </p>
                                                    {getStatusBadge(c.status)}
                                                </div>
                                                <p className="text-sm text-muted-foreground font-medium">
                                                    {c.description || "Sin descripción"}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>{c.created_at ? format(new Date(c.created_at), "d 'de' MMMM", { locale: es }) : "—"}</span>
                                                    {c.status === 'partially_paid' && (
                                                        <span className="text-primary font-medium">
                                                            {(c.payments || []).length} abonos realizados
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">
                                                    {formatCurrency(c.amount, c.currency)}
                                                </p>
                                                {balance < c.amount && balance > 0 && (
                                                    <p className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                        Pendiente: {formatCurrency(balance, c.currency)}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    {(c.status === 'active' || c.status === 'partially_paid') && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 gap-1.5"
                                                                onClick={() => {
                                                                    setSelectedCollection(c);
                                                                    setIsPaymentDialogOpen(true);
                                                                    setPaymentWalletId("none");
                                                                    setPaymentAmount("");
                                                                    setPaymentNotes("");
                                                                }}
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                Abonar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 px-2"
                                                                onClick={() => {
                                                                    setSelectedCollection(c);
                                                                    setIsMarkAsPaidDialogOpen(true);
                                                                    setPaymentWalletId("none");
                                                                }}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                                Total
                                                            </Button>
                                                        </>
                                                    )}
                                                    {c.status === 'pending_approval' && (
                                                        <p className="text-xs italic text-muted-foreground mr-2">Esperando confirmación...</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment History Miniature */}
                                    {c.payments.length > 0 && (
                                        <div className="mt-4 pt-4 border-t space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Historial de abonos</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {c.payments.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md text-xs border border-border/50">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-primary">
                                                                {formatCurrency(p.amount, c.currency)}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {format(new Date(p.date), "dd/MM/yy")}
                                                            </span>
                                                            {p.notes && <span className="text-muted-foreground italic truncate max-w-[80px]" title={p.notes}>({p.notes})</span>}
                                                        </div>
                                                        {!p.creditor_income_id ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-6 px-1.5 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/5"
                                                                onClick={() => {
                                                                    setSelectedPayment({ id: p.id, amount: p.amount, collection: c });
                                                                    setIsAllocationDialogOpen(true);
                                                                    setPaymentWalletId("none");
                                                                }}
                                                            >
                                                                <WalletIcon className="h-3 w-3" />
                                                                Ubicar
                                                            </Button>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                                                <Check className="h-3 w-3" />
                                                                Ubicado
                                                            </span>
                                                        )}
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

            {/* Abono Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Abono</DialogTitle>
                    </DialogHeader>
                    {selectedCollection && (
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 space-y-1">
                                <p className="text-xs font-bold uppercase text-orange-800">Saldo Pendiente</p>
                                <p className="text-2xl font-black text-orange-950">
                                    {formatCurrency(calculateBalance(selectedCollection), selectedCollection.currency)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pAmount">Monto del abono</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        id="pAmount"
                                        placeholder="0"
                                        className="pl-7"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(formatCOP(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pNotes">Notas (opcional)</Label>
                                <Input
                                    id="pNotes"
                                    placeholder="Ej: Transferencia Bancolombia"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>¿A qué cuenta llega el dinero?</Label>
                                <Select value={paymentWalletId} onValueChange={setPaymentWalletId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cuenta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguna (No registrar movimiento)</SelectItem>
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>
                                                {w.name} ({formatCurrency(w.balance, w.currency)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button className="w-full" onClick={handleAddPayment} disabled={isPending || !paymentAmount}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Abono"}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Mark as Paid Dialog */}
            <Dialog open={isMarkAsPaidDialogOpen} onOpenChange={setIsMarkAsPaidDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Marcar como Pagado</DialogTitle>
                    </DialogHeader>
                    {selectedCollection && (
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-green-50 border border-green-100 p-3 space-y-1">
                                <p className="text-xs font-bold uppercase text-green-800">Saldo Final a Cobrar</p>
                                <p className="text-2xl font-black text-green-950">
                                    {formatCurrency(calculateBalance(selectedCollection), selectedCollection.currency)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>¿A qué cuenta llega el dinero?</Label>
                                <Select value={paymentWalletId} onValueChange={setPaymentWalletId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cuenta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguna (No registrar movimiento)</SelectItem>
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>
                                                {w.name} ({formatCurrency(w.balance, w.currency)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleMarkAsPaid(selectedCollection.id)} disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Pago Total"}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Allocation Dialog (Ubicar Dinero) */}
            <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ubicar Dinero en Cuenta</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monto Recibido</p>
                                    <p className="text-2xl font-black text-primary">
                                        {formatCurrency(selectedPayment.amount, selectedPayment.collection.currency)}
                                    </p>
                                </div>
                                <div className="text-sm">
                                    <p className="text-muted-foreground leading-snug">
                                        Dinero enviado por <span className="font-bold text-foreground">
                                            {selectedPayment.collection.debtor?.full_name || selectedPayment.collection.debtor_name || "Amigo"}
                                        </span>
                                    </p>
                                    {selectedPayment.collection.description && (
                                        <p className="text-xs text-muted-foreground italic mt-1 italic">
                                            &quot;{selectedPayment.collection.description}&quot;
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>¿En qué cuenta recibiste el dinero?</Label>
                                <Select value={paymentWalletId} onValueChange={setPaymentWalletId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cuenta destino" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {wallets.length === 0 && <SelectItem value="none" disabled>No tienes cuentas registradas</SelectItem>}
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>
                                                {w.name} ({formatCurrency(w.balance, w.currency)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                className="w-full h-11 text-base font-semibold"
                                onClick={handleAllocateMoney}
                                disabled={isPending || paymentWalletId === "none" || wallets.length === 0}
                            >
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Recepción"}
                            </Button>

                            <p className="text-[10px] text-center text-muted-foreground">
                                Esto registrará un ingreso en tu cuenta y actualizará el saldo.
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
