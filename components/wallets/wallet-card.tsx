"use client";

import { useState } from "react";
import { Wallet, CreditCard, Banknote, PiggyBank, TrendingUp, MoreHorizontal, Trash, Pencil, Calendar, CalendarClock, BanknoteIcon, Table2 } from "lucide-react";
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
import { WalletForm } from "./wallet-form";
import { PayCreditCardDialog } from "./pay-credit-card-dialog";
import { CreditCardAmortizationDialog } from "./credit-card-amortization-dialog";
import { getNextCutDate, getNextPaymentDueDate, formatShortDate } from "@/lib/credit-card";
import type { Wallet as WalletType } from "@/lib/database.types";
import { COLOMBIAN_BANKS, getBankColor, getBankGradient } from "@/lib/banks";


interface WalletProps {
    id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
    color?: string | null;
    bank?: string | null;
    debit_card_brand?: string | null;
    credit_mode?: "account" | "card" | null;
    card_brand?: string | null;
    cut_off_day?: number | null;
    payment_due_day?: number | null;
    purchase_interest_rate?: number | null;
}

// Colores por franquicia de tarjeta
const CARD_BRAND_COLORS: Record<string, { gradient: string; bg: string; text: string }> = {
    visa: {
        gradient: "from-blue-600 via-blue-700 to-blue-800",
        bg: "bg-blue-700/70",
        text: "text-blue-50",
    },
    mastercard: {
        gradient: "from-orange-500 via-red-600 to-red-700",
        bg: "bg-red-600/70",
        text: "text-red-50",
    },
    amex: {
        gradient: "from-green-600 via-green-700 to-green-800",
        bg: "bg-green-700/70",
        text: "text-green-50",
    },
    diners: {
        gradient: "from-purple-600 via-purple-700 to-purple-800",
        bg: "bg-purple-700/70",
        text: "text-purple-50",
    },
    discover: {
        gradient: "from-orange-400 via-orange-500 to-orange-600",
        bg: "bg-orange-500/70",
        text: "text-orange-50",
    },
    jcb: {
        gradient: "from-red-500 via-red-600 to-red-700",
        bg: "bg-red-600/70",
        text: "text-red-50",
    },
    unionpay: {
        gradient: "from-yellow-500 via-yellow-600 to-yellow-700",
        bg: "bg-yellow-600/70",
        text: "text-yellow-50",
    },
    maestro: {
        gradient: "from-indigo-600 via-indigo-700 to-indigo-800",
        bg: "bg-indigo-700/70",
        text: "text-indigo-50",
    },
    other: {
        gradient: "from-slate-900 via-slate-800 to-slate-900",
        bg: "bg-slate-700/70",
        text: "text-slate-50",
    },
};

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
    
    // Determinar color: franquicia crédito > banco > personalizado > default
    let cardStyle = "";
    let iconBgStyle = "";
    let textStyle = "";
    let cardBorderStyle: React.CSSProperties = {};
    
    if (isCreditCard && wallet.card_brand) {
        // Prioridad 1: Colores por franquicia para tarjetas de crédito
        const brandColors = CARD_BRAND_COLORS[wallet.card_brand.toLowerCase()] || CARD_BRAND_COLORS.other;
        cardStyle = `overflow-hidden bg-gradient-to-br ${brandColors.gradient} text-white`;
        iconBgStyle = `rounded-xl ${brandColors.bg} p-3`;
        textStyle = brandColors.text;
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
    } else if (wallet.color) {
        // Prioridad 3: Color personalizado
        cardStyle = "overflow-hidden border-2";
        cardBorderStyle = { borderColor: wallet.color };
        iconBgStyle = "p-2 rounded-full";
        textStyle = "";
    } else {
        // Default
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
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${isDarkCard ? "text-white" : ""}`}>
                    {(isCreditCard && wallet.card_brand) && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${
                            isDarkCard ? "bg-white/10 border-white/20 text-white" : "bg-muted border-border"
                        }`}>
                            {wallet.card_brand}
                        </span>
                    )}
                    {(isDebit && wallet.debit_card_brand) && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${
                            isDarkCard ? "bg-white/10 border-white/20 text-white" : "bg-muted border-border"
                        }`}>
                            {wallet.debit_card_brand}
                        </span>
                    )}
                    {wallet.bank && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            isDarkCard ? "bg-white/10 border-white/20 text-white" : "bg-muted border-border"
                        }`}>
                            {COLOMBIAN_BANKS.find((b) => b.value === wallet.bank)?.label || wallet.bank}
                        </span>
                    )}
                    <span className="truncate">{wallet.name}</span>
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
                            ? { backgroundColor: `${wallet.color}20` } 
                            : wallet.bank && !isCreditCard && !isDarkCard
                            ? { backgroundColor: `${getBankColor(wallet.bank)}20` }
                            : {}
                    }>
                        <Icon 
                            className={`${isDarkCard ? `h-7 w-7 ${textStyle}` : wallet.color ? `h-6 w-6` : wallet.bank && !isCreditCard ? `h-6 w-6` : "h-6 w-6 text-primary"}`} 
                            style={
                                wallet.color && !isDarkCard 
                                    ? { color: wallet.color } 
                                    : wallet.bank && !isCreditCard && !isDarkCard
                                    ? { color: getBankColor(wallet.bank) || undefined }
                                    : {}
                            } 
                        />
                    </div>
                    <div>
                        <div className={`text-2xl font-bold ${isDarkCard ? "tracking-wide text-white" : ""}`}>
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
                                className={`shrink-0 ${isDarkCard ? "border-white/30 text-white hover:bg-white/10" : ""}`}
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
