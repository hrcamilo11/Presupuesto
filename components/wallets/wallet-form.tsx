"use client";

import { useState, useRef } from "react";
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
import { createWallet, updateWallet } from "@/app/actions/wallets";
import type { Wallet } from "@/lib/database.types";
import { COLOMBIAN_BANKS } from "@/lib/banks";

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

// Colores representativos por franquicia para asignación automática
const CARD_BRAND_COLOR_MAP: Record<string, string> = {
    visa: "#1A1F71",
    mastercard: "#EB001B",
    amex: "#006FCF",
    diners: "#0079BE",
    discover: "#FF6000",
    jcb: "#0B4EA2",
    unionpay: "#E21836",
    maestro: "#0099DD",
    other: "#1F2937",
};

const PRESET_COLORS = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#F97316", // orange
    "#6366F1", // indigo
    "#14B8A6", // teal
];

interface WalletFormProps {
    wallet?: Wallet;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function WalletForm({ wallet, open: controlledOpen, onOpenChange: controlledOnOpenChange }: WalletFormProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [showBalanceHelp, setShowBalanceHelp] = useState(false);
    const [showLimitHelp, setShowLimitHelp] = useState(false);
    const [showPurchaseRateHelp, setShowPurchaseRateHelp] = useState(false);
    const [showAdvanceRateHelp, setShowAdvanceRateHelp] = useState(false);
    const colorPickerRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { toast } = useToast();

    const isEditMode = !!wallet;
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;

    const form = useForm<WalletSchema>({
        resolver: zodResolver(walletSchema),
        defaultValues: wallet
            ? {
                  name: wallet.name,
                  type: wallet.type,
                  currency: wallet.currency,
                  balance: wallet.balance,
                  color: wallet.color || undefined,
                  bank: wallet.bank || undefined,
                  debit_card_brand: wallet.debit_card_brand || undefined,
                  credit_mode: wallet.credit_mode || undefined,
                  card_brand: wallet.card_brand || undefined,
                  cut_off_day: wallet.cut_off_day || undefined,
                  payment_due_day: (wallet as { payment_due_day?: number }).payment_due_day || undefined,
                  credit_limit: wallet.credit_limit || undefined,
                  cash_advance_limit: wallet.cash_advance_limit || undefined,
                  purchase_interest_rate: wallet.purchase_interest_rate || undefined,
                  cash_advance_interest_rate: wallet.cash_advance_interest_rate || undefined,
              }
            : {
                  name: "",
                  type: "cash",
                  currency: "COP",
                  balance: 0,
              },
    });

    const isLoading = form.formState.isSubmitting;
    const watchType = form.watch("type");
    const isCredit = watchType === "credit";
    const isDebit = watchType === "debit";
    const watchCreditMode = form.watch("credit_mode");
    const isCreditCard = isCredit && watchCreditMode === "card";
    const watchBank = form.watch("bank");
    const balanceLabel = isCredit ? "Deuda inicial" : "Balance inicial";
    const balanceHelp = isCredit
        ? "Si ya tienes saldo por pagar en esta tarjeta/crédito, colócalo aquí. Si está en $0, déjalo en 0."
        : "Dinero disponible con el que inicias esta cuenta.";
    
    // Auto-asignar color del banco si es débito o crédito y no hay color personalizado
    const selectedBank = COLOMBIAN_BANKS.find((b) => b.value === watchBank);
    if ((isDebit || isCredit) && selectedBank && !form.watch("color")) {
        // No auto-asignar aquí, solo mostrar el color del banco como sugerencia
    }

    async function onSubmit(data: WalletSchema) {
        let result;
        if (isEditMode && wallet) {
            result = await updateWallet(wallet.id, data);
        } else {
            result = await createWallet(data);
        }

        if (result.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
            });
        } else {
            toast({
                title: isEditMode ? "Cuenta actualizada" : "Cuenta creada",
                description: isEditMode
                    ? "La cuenta se ha actualizado exitosamente."
                    : "La cuenta se ha registrado exitosamente.",
            });
            if (!isEditMode) {
                form.reset();
            }
            setOpen(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isEditMode && (
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Cuenta
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Editar Cuenta" : "Agregar Cuenta"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? "Modifica los datos de tu cuenta o billetera."
                            : "Registra una nueva cuenta o billetera para administrar tus gastos."}
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

                        {isDebit && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bank"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Banco</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    // Auto-asignar color del banco si no hay color personalizado
                                                    if (!form.watch("color")) {
                                                        const bankData = COLOMBIAN_BANKS.find((b) => b.value === value);
                                                        if (bankData) {
                                                            form.setValue("color", bankData.color);
                                                        }
                                                    }
                                                }}
                                                defaultValue={field.value ?? undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona el banco" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COLOMBIAN_BANKS.map((bank) => (
                                                        <SelectItem key={bank.value} value={bank.value}>
                                                            {bank.label}
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
                                    name="debit_card_brand"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Franquicia de tarjeta</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value ?? undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {CARD_BRANDS.map((brand) => (
                                                        <SelectItem key={brand.value} value={brand.value}>
                                                            {brand.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {isCredit && (
                            <FormField
                                control={form.control}
                                name="bank"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Banco (opcional)</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                const next = value === "__none__" ? null : value;
                                                field.onChange(next);
                                                // Auto-asignar color del banco si no hay color personalizado
                                                if (next && !form.watch("color")) {
                                                    const bankData = COLOMBIAN_BANKS.find((b) => b.value === next);
                                                    if (bankData) {
                                                        form.setValue("color", bankData.color);
                                                    }
                                                }
                                            }}
                                            defaultValue={field.value && field.value !== "" ? field.value : "__none__"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona el banco (opcional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="__none__">Ninguno</SelectItem>
                                                {COLOMBIAN_BANKS.map((bank) => (
                                                    <SelectItem key={bank.value} value={bank.value}>
                                                        {bank.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

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

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color personalizado (opcional)</FormLabel>
                                        <div className="space-y-2">
                                            <input
                                                ref={colorPickerRef}
                                                type="color"
                                                className="sr-only w-0 h-0 opacity-0 absolute pointer-events-none"
                                                value={field.value && /^#[0-9A-Fa-f]{6}$/.test(field.value) ? field.value : "#3B82F6"}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                aria-hidden
                                            />
                                            <div className="flex gap-2 flex-wrap">
                                                {PRESET_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                            field.value === color
                                                                ? "border-foreground scale-110"
                                                                : "border-transparent hover:scale-105"
                                                        }`}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => field.onChange(field.value === color ? null : color)}
                                                        aria-label={`Seleccionar color ${color}`}
                                                    />
                                                ))}
                                                <button
                                                    type="button"
                                                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center bg-muted hover:bg-muted/80 ${
                                                        field.value && !PRESET_COLORS.includes(field.value)
                                                            ? "border-foreground scale-110"
                                                            : "border-transparent hover:scale-105"
                                                    }`}
                                                    onClick={() => colorPickerRef.current?.click()}
                                                    aria-label="Abrir selector de color RGB"
                                                    title="Elegir otro color"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            {field.value && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <div
                                                        className="w-4 h-4 rounded border"
                                                        style={{ backgroundColor: field.value }}
                                                    />
                                                    <span>{field.value}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => field.onChange(null)}
                                                        className="text-destructive hover:underline"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            // Auto-asignar color de la franquicia si no hay color personalizado
                                                            if (!form.watch("color")) {
                                                                const brandColor = CARD_BRAND_COLOR_MAP[value.toLowerCase()];
                                                                if (brandColor) {
                                                                    form.setValue("color", brandColor);
                                                                }
                                                            }
                                                        }}
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
                                        name="payment_due_day"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Día de pago</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={31}
                                                        placeholder="Ej. 10"
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
                                                <FormDescription>Día límite para pagar (evitar intereses).</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                                        <FormLabel className="flex items-center justify-between">
                                                            <span>Tasa interés compras (% mensual)</span>
                                                            <button
                                                                type="button"
                                                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                                                                onClick={() =>
                                                                    setShowPurchaseRateHelp((v) => !v)
                                                                }
                                                                aria-label="Ayuda sobre tasa de interés de compras"
                                                            >
                                                                <HelpCircle className="h-4 w-4" />
                                                            </button>
                                                        </FormLabel>
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
                                                        {showPurchaseRateHelp && (
                                                            <div className="mt-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                                Porcentaje mensual que el banco cobra sobre las
                                                                compras diferidas que no se pagan en la fecha de
                                                                corte.
                                                            </div>
                                                        )}
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
                                                    <FormLabel className="flex items-center justify-between">
                                                        <span>Tasa interés avances (% mensual)</span>
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                                                            onClick={() =>
                                                                setShowAdvanceRateHelp((v) => !v)
                                                            }
                                                            aria-label="Ayuda sobre tasa de interés de avances"
                                                        >
                                                            <HelpCircle className="h-4 w-4" />
                                                        </button>
                                                    </FormLabel>
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
                                                    {showAdvanceRateHelp && (
                                                        <div className="mt-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                            Porcentaje mensual que el banco cobra sobre el dinero
                                                            que retiras como avance en efectivo de la tarjeta.
                                                        </div>
                                                    )}
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
