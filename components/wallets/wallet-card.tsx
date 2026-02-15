"use client";

import { useState } from "react";
import { Wallet, CreditCard, Banknote, PiggyBank, TrendingUp, MoreHorizontal, Trash, Pencil, Calendar, CalendarClock, BanknoteIcon, Table2, History } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteWallet } from "@/app/actions/wallets";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { WalletForm } from "./wallet-form";
import { PayCreditCardDialog } from "./pay-credit-card-dialog";
import { CreditCardAmortizationDialog } from "./credit-card-amortization-dialog";
import { CardBrandLogo } from "./card-brand-logo";
import { getNextCutDate, getNextPaymentDueDate, formatShortDate } from "@/lib/credit-card";
import type { Wallet as WalletType } from "@/lib/database.types";
import { COLOMBIAN_BANKS, getBankColor, getBankGradient } from "@/lib/banks";

/** Devuelve true si el color hex es claro (fondo blanco/claro → usar texto oscuro). */
function isLightColor(hex: string | null | undefined): boolean {
    if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return false;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 0.7;
}

interface WalletProps {
    id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
    color?: string | null;
    bank?: string | null;
    debit_card_brand?: string | null;
    last_four_digits?: string | null;
    credit_mode?: "account" | "card" | null;
    card_brand?: string | null;
    cut_off_day?: number | null;
    payment_due_day?: number | null;
    purchase_interest_rate?: number | null;
}

const typeIcons = {
    cash: Banknote,
    debit: CreditCard,
    credit: CreditCard,
    savings: PiggyBank,
    investment: TrendingUp,
};

const typeLabels = {
    cash: "Efectivo",
    debit: "Débito",
    credit: "Crédito",
    savings: "Ahorros",
    investment: "Inversión",
};

interface WalletCardProps {
    wallet: WalletProps;
    wallets?: WalletType[];
}

export function WalletCard({ wallet, wallets = [] }: WalletCardProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    const [amortOpen, setAmortOpen] = useState(false);
    const Icon = typeIcons[wallet.type as keyof typeof typeIcons] || Wallet;
    const label = typeLabels[wallet.type as keyof typeof typeLabels] || "Cuenta";
    const { toast } = useToast();
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("¿Estás seguro de eliminar esta cuenta? Se perderá el historial asociado si no está respaldado (aunque la integridad referencial debería impedirlo si hay datos).")) return;

        const res = await deleteWallet(wallet.id);
        if (res.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: res.error,
            });
        } else {
            toast({
                title: "Eliminado",
                description: "La cuenta ha sido eliminada.",
            });
            router.refresh();
        }
    }

    const isCreditCard = wallet.type === "credit" && wallet.credit_mode === "card";
    const isDebit = wallet.type === "debit";
    
    // Prioridad de color: personalizado > banco > default (la franquicia solo aporta el logo)
    let cardStyle = "";
    let iconBgStyle = "";
    let textStyle = "";
    let cardBorderStyle: React.CSSProperties = {};
    
    if (wallet.color) {
        // Prioridad 1: Color personalizado
        cardStyle = "overflow-hidden border-2";
        cardBorderStyle = { borderColor: wallet.color };
        iconBgStyle = "p-2 rounded-full";
        textStyle = isLightColor(wallet.color) ? "text-foreground" : "";
    } else if ((isDebit || (wallet.type === "credit" && wallet.bank)) && wallet.bank) {
        // Prioridad 2: Colores del banco para débito o crédito con banco
        const bankGradient = getBankGradient(wallet.bank);
        const bankColor = getBankColor(wallet.bank);
        if (bankGradient) {
            cardStyle = `overflow-hidden bg-gradient-to-br ${bankGradient} text-white`;
            iconBgStyle = `rounded-xl bg-white/20 p-3`;
            textStyle = "text-white";
        } else if (bankColor) {
            cardStyle = "overflow-hidden border-2";
            cardBorderStyle = { borderColor: bankColor };
            iconBgStyle = "p-2 rounded-full";
            textStyle = "";
        }
    }
    if (!cardStyle) {
        // Default (franquicia ya no pinta la tarjeta; solo se muestra su logo)
        cardStyle = "";
        iconBgStyle = "p-2 bg-primary/10 rounded-full";
        textStyle = "";
    }
    
    const isDarkCard = cardStyle.includes("bg-gradient-to-br");

    const cutDay = wallet.cut_off_day ?? 15;
    const nextCut = getNextCutDate(cutDay);
    const nextPaymentDue = getNextPaymentDueDate(
        cutDay,
        wallet.payment_due_day ?? null
    );

    return (
        <div className="h-full min-h-0">
            <Card className={`h-full flex flex-col ${cardStyle}`} style={cardBorderStyle}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 flex-wrap ${isDarkCard ? "text-white" : "text-foreground"}`}>
                    <span className="truncate">{wallet.name}</span>
                    {(wallet.last_four_digits && (isCreditCard || isDebit)) && (
                        <span className={`text-[10px] tabular-nums ${isDarkCard ? "text-white/80" : "text-muted-foreground"}`}>
                            •••• {wallet.last_four_digits}
                        </span>
                    )}
                    {wallet.bank && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${
                            isDarkCard ? "bg-white/10 border-white/20 text-white" : "bg-muted border-border"
                        }`}>
                            {COLOMBIAN_BANKS.find((b) => b.value === wallet.bank)?.label || wallet.bank}
                        </span>
                    )}
                    {(isCreditCard && wallet.card_brand) && (
                        <CardBrandLogo brand={wallet.card_brand} dark={isDarkCard} className="shrink-0 ml-auto" />
                    )}
                    {(isDebit && wallet.debit_card_brand) && (
                        <CardBrandLogo brand={wallet.debit_card_brand} dark={isDarkCard} className="shrink-0 ml-auto" />
                    )}
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={`h-8 w-8 p-0 ${isDarkCard ? "text-white hover:bg-white/10" : ""}`}>
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/wallets/${wallet.id}/history`}>
                                <History className="mr-2 h-4 w-4" />
                                Ver historial
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditOpen(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="flex items-center space-x-4">
                    <div className={iconBgStyle} style={
                        wallet.color && !isCreditCard && !isDarkCard 
                            ? { backgroundColor: isLightColor(wallet.color) ? "hsl(var(--muted))" : `${wallet.color}20` } 
                            : wallet.bank && !isCreditCard && !isDarkCard
                            ? { backgroundColor: `${getBankColor(wallet.bank)}20` }
                            : {}
                    }>
                        <Icon 
                            className={`${isDarkCard ? `h-7 w-7 ${textStyle}` : wallet.color ? `h-6 w-6 ${textStyle || ""}` : wallet.bank && !isCreditCard ? `h-6 w-6` : "h-6 w-6 text-primary"}`} 
                            style={
                                wallet.color && !isDarkCard && !isLightColor(wallet.color)
                                    ? { color: wallet.color } 
                                    : wallet.bank && !isCreditCard && !isDarkCard
                                    ? { color: getBankColor(wallet.bank) || undefined }
                                    : {}
                            } 
                        />
                    </div>
                    <div>
                        <div className={`text-2xl font-bold ${isDarkCard ? "tracking-wide text-white" : "text-foreground"}`}>
                            {formatCurrency(wallet.balance, wallet.currency)}
                        </div>
                        <p className={isDarkCard ? `text-[11px] ${textStyle}/80 capitalize` : "text-xs text-muted-foreground capitalize"}>
                            {label}
                        </p>
                    </div>
                </div>

                {isCreditCard && (
                    <div className={`mt-4 shrink-0 space-y-2 border-t pt-3 ${isDarkCard ? "border-white/20" : "border-border"}`}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                            <span className={`flex items-center gap-1 ${isDarkCard ? "text-white/90" : "text-muted-foreground"}`}>
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                Corte: {formatShortDate(nextCut)}
                            </span>
                            <span className={`flex items-center gap-1 ${isDarkCard ? "text-white/90" : "text-muted-foreground"}`}>
                                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                                Pago: {formatShortDate(nextPaymentDue)}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                variant={isDarkCard ? "secondary" : "default"}
                                className={`shrink-0 ${isDarkCard ? "bg-white/20 text-white hover:bg-white/30" : ""}`}
                                onClick={() => setPayOpen(true)}
                            >
                                <BanknoteIcon className="mr-1.5 h-4 w-4 shrink-0" />
                                Pagar
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className={`shrink-0 ${isDarkCard ? "border-white/50 bg-transparent text-white hover:bg-white/15 hover:text-white" : ""}`}
                                onClick={() => setAmortOpen(true)}
                            >
                                <Table2 className="mr-1.5 h-4 w-4 shrink-0" />
                                Amortización
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
            </Card>
            <WalletForm wallet={wallet as WalletType} open={editOpen} onOpenChange={setEditOpen} />
            {isCreditCard && wallets.length > 0 && (
                <PayCreditCardDialog
                    open={payOpen}
                    onOpenChange={setPayOpen}
                    creditWallet={wallet as WalletType}
                    wallets={wallets}
                />
            )}
            {isCreditCard && (
                <CreditCardAmortizationDialog
                open={amortOpen}
                onOpenChange={setAmortOpen}
                balance={wallet.balance}
                monthlyRatePercent={wallet.purchase_interest_rate ?? 0}
                currency={wallet.currency}
                />
            )}
        </div>
    );
}
