"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { transferBetweenWallets } from "@/app/actions/wallets";
import type { Wallet } from "@/lib/database.types";

interface TransferFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    wallets: Wallet[];
}

export function TransferForm({ open, onOpenChange, wallets }: TransferFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fromWalletId, setFromWalletId] = useState("");
    const [toWalletId, setToWalletId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (fromWalletId === toWalletId) {
            alert("Las cuentas de origen y destino deben ser diferentes.");
            return;
        }

        setLoading(true);
        const result = await transferBetweenWallets({
            from_wallet_id: fromWalletId,
            to_wallet_id: toWalletId,
            amount: Number(amount),
            description: description || "",
        });

        setLoading(false);
        if (result.error) {
            alert(result.error);
            return;
        }

        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transferencia entre cuentas</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Desde</Label>
                        <Select value={fromWalletId} onValueChange={setFromWalletId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona origen" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>
                                        {w.name} (${Number(w.balance).toLocaleString()})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Hacia</Label>
                        <Select value={toWalletId} onValueChange={setToWalletId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona destino" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>
                                        {w.name} (${Number(w.balance).toLocaleString()})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto</Label>
                        <CurrencyInput
                            id="amount"
                            value={amount}
                            onChange={(v) => setAmount(String(v))}
                            placeholder="0"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej. Traspaso de fondos, ahorro..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Transferir
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
