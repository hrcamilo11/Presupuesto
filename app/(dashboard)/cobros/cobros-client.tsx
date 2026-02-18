"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Plus, Check, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCollection, markCollectionAsPaid, addCollectionPayment } from "@/app/actions/collections";
import type { Profile, Collection, CollectionPayment } from "@/lib/database.types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CobrosClientProps {
    initialCollections: (Collection & { debtor: Profile | null, payments: CollectionPayment[] })[];
    friends: { friendship_id: string, profile: Profile }[];
}

export function CobrosClient({ initialCollections, friends }: CobrosClientProps) {
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

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

    function handleCreate() {
        if (selectedFriendId !== "manual" && !selectedFriendId) return;
        if (selectedFriendId === "manual" && !debtorName) return;
        if (!amount) return;

        startTransition(async () => {
            const finalDebtorId = selectedFriendId === "manual" ? null : selectedFriendId;
            const { error } = await createCollection(finalDebtorId, parseFloat(amount), 'COP', description, debtorName);
            if (error) {
                setMsg(error);
            } else {
                setMsg(finalDebtorId ? "Cobro enviado al amigo." : "Cobro manual registrado.");
                setIsDialogOpen(false);
                setSelectedFriendId("manual");
                setDebtorName("");
                setAmount("");
                setDescription("");
            }
        });
    }

    function handleMarkAsPaid(id: string) {
        if (!confirm("¿Confirmas que recibiste el pago total de este cobro?")) return;
        startTransition(async () => {
            const { error } = await markCollectionAsPaid(id);
            setMsg(error ? error : "Cobro marcado como pagado.");
        });
    }

    function handleAddPayment() {
        if (!selectedCollection || !paymentAmount) return;
        startTransition(async () => {
            const { error } = await addCollectionPayment(selectedCollection.id, parseFloat(paymentAmount), paymentNotes);
            if (error) {
                setMsg(error);
            } else {
                setMsg("Abono registrado con éxito.");
                setIsPaymentDialogOpen(false);
                setPaymentAmount("");
                setPaymentNotes("");
                setSelectedCollection(null);
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
                                                    <span>{format(new Date(c.created_at), "d 'de' MMMM", { locale: es })}</span>
                                                    {c.status === 'partially_paid' && (
                                                        <span className="text-primary font-medium">
                                                            {c.payments.length} abonos realizados
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: c.currency }).format(c.amount)}
                                                </p>
                                                {balance < c.amount && balance > 0 && (
                                                    <p className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                        Pendiente: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: c.currency }).format(balance)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {(c.status === 'active' || c.status === 'partially_paid') && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1.5"
                                                            onClick={() => {
                                                                setSelectedCollection(c);
                                                                setIsPaymentDialogOpen(true);
                                                            }}
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                            Abonar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 px-2"
                                                            onClick={() => handleMarkAsPaid(c.id)}
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

                                    {/* Payment History Miniature */}
                                    {c.payments.length > 0 && (
                                        <div className="mt-4 pt-4 border-t space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Historial de abonos</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {c.payments.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md text-xs border border-border/50">
                                                        <div>
                                                            <span className="font-bold text-primary">
                                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: c.currency }).format(p.amount)}
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
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: selectedCollection.currency }).format(calculateBalance(selectedCollection))}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pAmount">Monto del abono</Label>
                                <Input
                                    id="pAmount"
                                    type="number"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
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
                            <Button className="w-full" onClick={handleAddPayment} disabled={isPending || !paymentAmount}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Abono"}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
