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
import { payCreditCard } from "@/app/actions/wallets";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Wallet } from "@/lib/database.types";

interface PayCreditCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    creditWallet: Wallet;
    wallets: Wallet[];
}

export function PayCreditCardDialog({
    open,
    onOpenChange,
    creditWallet,
    wallets,
}: PayCreditCardDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fromWalletId, setFromWalletId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    const sourceWallets = wallets.filter(
        (w) => w.id !== creditWallet.id && w.type !== "credit"
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const num = Number(amount);
        if (!fromWalletId || num <= 0) return;

        setLoading(true);
        const result = await payCreditCard({
            from_wallet_id: fromWalletId,
            to_wallet_id: creditWallet.id,
            amount: num,
            description: description || "Pago tarjeta de crédito",
        });

        setLoading(true);
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
            });
            setLoading(false);
            return;
        }

        toast({
            title: "Pago realizado",
            description: "Se ha registrado el pago de la tarjeta y el gasto asociado.",
        });
        setLoading(false);
        onOpenChange(false);
        setAmount("");
        setDescription("");
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pagar tarjeta: {creditWallet.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Desde cuenta</Label>
                        <Select
                            value={fromWalletId}
                            onValueChange={setFromWalletId}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona origen" />
                            </SelectTrigger>
                            <SelectContent>
                                {sourceWallets.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>
                                        {w.name} (
                                        {formatCurrency(Number(w.balance), w.currency)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pay-amount">Monto a pagar</Label>
                        <CurrencyInput
                            id="pay-amount"
                            value={amount}
                            onChange={(v) => setAmount(String(v))}
                            placeholder="0"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Deuda actual:{" "}
                            {formatCurrency(Number(creditWallet.balance), creditWallet.currency)}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pay-desc">Descripción (opcional)</Label>
                        <Textarea
                            id="pay-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej. Pago cuota mensual"
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Pagar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
