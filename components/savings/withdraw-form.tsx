"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { withdrawFromSavings } from "@/app/actions/savings";
import type { Wallet } from "@/lib/database.types";

const withdrawSchema = z.object({
    savings_goal_id: z.string().uuid(),
    wallet_id: z.string().uuid({ message: "Elige la cuenta a la que reintegrar" }),
    amount: z.number().positive("El monto debe ser mayor a 0"),
    date: z.string().min(1, "Fecha requerida"),
    notes: z.string().optional(),
});

type WithdrawSchema = z.infer<typeof withdrawSchema>;

export function WithdrawForm({
    goalId,
    goalName,
    currentAmount,
    wallets,
}: {
    goalId: string;
    goalName: string;
    currentAmount: number;
    wallets: Wallet[];
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<WithdrawSchema>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            savings_goal_id: goalId,
            wallet_id: "",
            amount: 0,
            date: new Date().toISOString().split("T")[0],
            notes: "",
        },
    });

    const isLoading = form.formState.isSubmitting;

    async function onSubmit(data: WithdrawSchema) {
        const result = await withdrawFromSavings(data);
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
            });
        } else {
            toast({
                title: "Retiro realizado",
                description: "El monto se ha reintegrado a la cuenta seleccionada.",
            });
            form.reset({
                savings_goal_id: goalId,
                wallet_id: "",
                amount: 0,
                date: new Date().toISOString().split("T")[0],
                notes: "",
            });
            setOpen(false);
            router.refresh();
        }
    }

    const maxAmount = currentAmount;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1" disabled={maxAmount <= 0}>
                    <ArrowDownToLine className="h-4 w-4" />
                    Retirar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Retirar de la meta</DialogTitle>
                    <DialogDescription>
                        Reintegra dinero de &quot;{goalName}&quot; a una cuenta. Saldo actual: {maxAmount.toLocaleString("es-CO")}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="wallet_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cuenta de destino</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Elige la cuenta" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {wallets.map((w) => (
                                                <SelectItem key={w.id} value={w.id}>
                                                    {w.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto a retirar</FormLabel>
                                    <FormControl>
                                        <CurrencyInput
                                            value={field.value ? String(field.value) : ""}
                                            onChange={(v) => field.onChange(Number(v) || 0)}
                                            placeholder="0"
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        Máximo: {maxAmount.toLocaleString("es-CO")}
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (opcional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ej. Retiro parcial" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading || maxAmount <= 0}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Retirar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
