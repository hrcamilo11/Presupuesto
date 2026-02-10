"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "@/lib/database.types";
import { transferBetweenWallets } from "@/app/actions/wallets";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";

type Props = {
    wallets: Wallet[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultFromId?: string;
};

export function TransferDialog({ wallets, open, onOpenChange, defaultFromId }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [fromId, setFromId] = useState(defaultFromId || "");
    const [toId, setToId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    async function handleTransfer(e: React.FormEvent) {
        e.preventDefault();
        if (fromId === toId) {
            setError("La cuenta de origen y destino deben ser diferentes");
            return;
        }

        setLoading(true);
        setError(null);

        const result = await transferBetweenWallets({
            fromWalletId: fromId,
            toWalletId: toId,
            amount: parseFloat(amount),
            description: description.trim() || "Transferencia entre cuentas",
        });

        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        onOpenChange(false);
        setAmount("");
        setDescription("");
        setToId("");
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Transferir entre cuentas
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTransfer} className="space-y-4">
                    {error && (
                        <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Origen</Label>
                            <Select value={fromId} onValueChange={setFromId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Desde..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name} (${w.balance})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Destino</Label>
                            <Select value={toId} onValueChange={setToId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Hacia..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej. Traspaso a ahorros"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Transfiriendo..." : "Transferir"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
