"use client";

import { useState, useTransition } from "react";
import { ArrowDownLeft, Check, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { respondToCollection } from "@/app/actions/collections";

interface DeudasClientProps {
    initialDebts: any[];
}

export function DeudasClient({ initialDebts }: DeudasClientProps) {
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<string | null>(null);

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_approval': return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Por Aprobar</span>;
            case 'active': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Activa</span>;
            case 'paid': return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Pagada</span>;
            case 'rejected': return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Rechazada</span>;
            default: return null;
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 md:px-8">
            <header className="border-b border-border/80 pb-6">
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
                    initialDebts.map((d) => (
                        <Card key={d.id} className={d.status === 'pending_approval' ? "border-primary/50 bg-primary/5" : ""}>
                            <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{d.creditor.full_name || d.creditor.username}</p>
                                        <p className="text-sm text-muted-foreground">{d.description || "Sin descripción"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getStatusBadge(d.status)}
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(d.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="text-lg font-bold text-destructive">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: d.currency }).format(d.amount)}
                                    </p>
                                    {d.status === 'pending_approval' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                onClick={() => handleResponse(d.id, true)}
                                                disabled={isPending}
                                            >
                                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                                Aceptar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleResponse(d.id, false)}
                                                disabled={isPending}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Rechazar
                                            </Button>
                                        </div>
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
