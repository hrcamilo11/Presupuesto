"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Loader2, HelpCircle } from "lucide-react";
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
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import { walletSchema, type WalletSchema } from "@/lib/validations/wallet";
import { createWallet } from "@/app/actions/wallets";

const walletTypes = [
    { value: "cash", label: "Efectivo" },
    { value: "debit", label: "Débito" },
    { value: "credit", label: "Crédito" },
    { value: "savings", label: "Ahorros" },
    { value: "investment", label: "Inversión" },
] as const;

const CARD_BRANDS = [
    { value: "visa", label: "Visa" },
    { value: "mastercard", label: "Mastercard" },
    { value: "amex", label: "American Express" },
    { value: "diners", label: "Diners Club" },
    { value: "discover", label: "Discover" },
    { value: "jcb", label: "JCB" },
    { value: "unionpay", label: "UnionPay" },
    { value: "maestro", label: "Maestro" },
    { value: "other", label: "Otra" },
] as const;

export function WalletForm() {
    const [open, setOpen] = useState(false);
    const [showBalanceHelp, setShowBalanceHelp] = useState(false);
    const [showLimitHelp, setShowLimitHelp] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<WalletSchema>({
        resolver: zodResolver(walletSchema),
        defaultValues: {
            name: "",
            type: "cash",
            currency: "COP",
            balance: 0,
        },
    });

    const isLoading = form.formState.isSubmitting;
    const watchType = form.watch("type");
    const isCredit = watchType === "credit";
    const watchCreditMode = form.watch("credit_mode");
    const isCreditCard = isCredit && watchCreditMode === "card";
    const balanceLabel = isCredit ? "Deuda inicial" : "Balance inicial";
    const balanceHelp = isCredit
        ? "Si ya tienes saldo por pagar en esta tarjeta/crédito, colócalo aquí. Si está en $0, déjalo en 0."
        : "Dinero disponible con el que inicias esta cuenta.";

    async function onSubmit(data: WalletSchema) {
        const result = await createWallet(data);

        if (result.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
            });
        } else {
            toast({
                title: "Cuenta creada",
                description: "La cuenta se ha registrado exitosamente.",
            });
            form.reset();
            setOpen(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Cuenta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Cuenta</DialogTitle>
                    <DialogDescription>
                        Registra una nueva cuenta o billetera para administrar tus gastos.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. BBVA Nómina, Efectivo..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {walletTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
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
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Moneda</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Moneda" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="COP">COP</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="balance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center justify-between">
                                        <span>{balanceLabel}</span>
                                        <button
                                            type="button"
                                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowBalanceHelp((v) => !v)}
                                            aria-label="Ayuda sobre balance inicial"
                                        >
                                            <HelpCircle className="h-4 w-4" />
                                        </button>
                                    </FormLabel>
                                    <FormControl>
                                        <CurrencyInput
                                            placeholder="0"
                                            {...field}
                                        />
                                    </FormControl>
                                    {showBalanceHelp && (
                                        <div className="mt-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                            {balanceHelp}
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isCredit && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="credit_mode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de crédito</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="account">Cuenta de crédito</SelectItem>
                                                        <SelectItem value="card">Tarjeta de crédito</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {isCreditCard ? (
                                        <FormField
                                            control={form.control}
                                            name="card_brand"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Franquicia / marca</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {CARD_BRANDS.map((b) => (
                                                                <SelectItem key={b.value} value={b.value}>
                                                                    {b.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ) : (
                                        <div />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="cut_off_day"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Día de corte</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={31}
                                                        placeholder="Ej. 15"
                                                        value={field.value ?? ""}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value
                                                                    ? Number(e.target.value)
                                                                    : undefined,
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormDescription>Solo aplica para tarjetas.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="credit_limit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center justify-between">
                                                    <span>Cupo total</span>
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowLimitHelp((v) => !v)}
                                                        aria-label="Ayuda sobre cupo total"
                                                    >
                                                        <HelpCircle className="h-4 w-4" />
                                                    </button>
                                                </FormLabel>
                                                <FormControl>
                                                    <CurrencyInput
                                                        placeholder="0"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                {showLimitHelp && (
                                                    <div className="mt-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                        Límite máximo de crédito (no es tu deuda).
                                                    </div>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {isCreditCard && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="cash_advance_limit"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cupo para avances (opcional)</FormLabel>
                                                        <FormControl>
                                                            <CurrencyInput
                                                                placeholder="0"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="purchase_interest_rate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tasa interés compras (% mensual)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Ej. 2.3"
                                                                value={field.value ?? ""}
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target.value
                                                                            ? Number(e.target.value)
                                                                            : undefined,
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="cash_advance_interest_rate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tasa interés avances (% mensual)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Ej. 2.8"
                                                            value={field.value ?? ""}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value
                                                                        ? Number(e.target.value)
                                                                        : undefined,
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
