"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Plus, Check, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCollection, markCollectionAsPaid } from "@/app/actions/collections";
import type { Profile, Collection } from "@/lib/database.types";

interface CobrosClientProps {
    initialCollections: (Collection & { debtor: Profile })[];
    friends: { friendship_id: string, profile: Profile }[];
}

export function CobrosClient({ initialCollections, friends }: CobrosClientProps) {
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // Form state
    const [selectedFriendId, setSelectedFriendId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    function handleCreate() {
        if (!selectedFriendId || !amount) return;
        startTransition(async () => {
            const { error } = await createCollection(selectedFriendId, parseFloat(amount), 'COP', description);
            if (error) {
                setMsg(error);
            } else {
                setMsg("Cobro enviado al amigo.");
                setIsDialogOpen(false);
                setSelectedFriendId("");
                setAmount("");
                setDescription("");
            }
        });
    }

    function handleMarkAsPaid(id: string) {
        if (!confirm("¿Confirmas que recibiste el pago de este cobro?")) return;
        startTransition(async () => {
            const { error } = await markCollectionAsPaid(id);
            setMsg(error ? error : "Cobro marcado como pagado.");
        });
    }

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
                                <Label>Amigo</Label>
                                <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un amigo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {friends.map(f => (
                                            <SelectItem key={f.profile.id} value={f.profile.id}>
                                                {f.profile.full_name || f.profile.username} (@{f.profile.username})
                                            </SelectItem>
                                        ))}
                                        {friends.length === 0 && (
                                            <div className="p-2 text-sm text-center text-muted-foreground">
                                                No tienes amigos aceptados aún.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
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
                            <Button className="w-full" onClick={handleCreate} disabled={isPending || !selectedFriendId || !amount}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Cobro"}
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
                    initialCollections.map((c) => (
                        <Card key={c.id}>
                            <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{c.debtor.full_name || c.debtor.username}</p>
                                        <p className="text-sm text-muted-foreground">{c.description || "Sin descripción"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getStatusBadge(c.status)}
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="text-lg font-bold text-primary">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: c.currency }).format(c.amount)}
                                    </p>
                                    {c.status === 'active' && (
                                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleMarkAsPaid(c.id)}>
                                            <Check className="h-4 w-4 mr-1" />
                                            Pagado
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
