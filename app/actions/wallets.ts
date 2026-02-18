"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { walletSchema } from "@/lib/validations/wallet";
import { withFailover, isNetworkOrServerError } from "@/lib/backend/with-failover";
import { getUserIdForFailover } from "@/lib/backend/auth-context";
import {
    getWalletsFromAppwrite,
    syncWalletToAppwrite,
    updateWalletInAppwrite,
    updateWalletPartialInAppwrite,
    deleteWalletFromAppwrite,
    createWalletInAppwrite,
} from "@/lib/backend/wallets-appwrite";
import { isAppwriteConfigured } from "@/lib/appwrite/client";
import type { Wallet } from "@/lib/database.types";

/** Crea la cuenta de efectivo por defecto si el usuario no tiene ninguna cuenta. */
async function ensureDefaultWallet(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
) {
    const { data: existing } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from("wallets").insert({
        user_id: userId,
        name: "Efectivo",
        type: "cash",
        currency: "COP",
        balance: 0,
    });
}

export async function getWallets() {
    async function primary(): Promise<Wallet[]> {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");
        const { data, error } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            await ensureDefaultWallet(supabase, user.id);
            const ret = await supabase
                .from("wallets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });
            if (ret.error) throw new Error(ret.error.message);
            return ret.data ?? [];
        }
        return data as Wallet[];
    }
    async function fallback(): Promise<Wallet[]> {
        const userId = await getUserIdForFailover();
        if (!userId) throw new Error("No autenticado");
        return await getWalletsFromAppwrite(userId);
    }
    if (isAppwriteConfigured()) {
        try {
            const data = await withFailover(primary, fallback);
            return { data, error: null };
        } catch (e) {
            return { data: [], error: (e instanceof Error ? e.message : "Error al cargar cuentas") };
        }
    }
    try {
        const data = await primary();
        return { data, error: null };
    } catch (e) {
        return { data: [], error: (e instanceof Error ? e.message : "Error al cargar cuentas") };
    }
}

export async function createWallet(formData: {
    name: string;
    type: "cash" | "debit" | "credit" | "investment";
    currency: string;
    balance?: number;
    color?: string | null;
    bank?: string | null;
    debit_card_brand?: string | null;
    last_four_digits?: string | null;
    credit_mode?: "account" | "card";
    card_brand?: string;
    cut_off_day?: number;
    payment_due_day?: number;
    credit_limit?: number;
    cash_advance_limit?: number;
    purchase_interest_rate?: number;
    cash_advance_interest_rate?: number;
    investment_yield_rate?: number;
    investment_term?: string;
    investment_start_date?: string;
}) {
    const parsed = walletSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "No autenticado" };

        const insertPayload = {
            user_id: user.id,
            name: formData.name,
            type: formData.type,
            currency: formData.currency,
            balance: formData.balance || 0,
            color: formData.color || null,
            bank: formData.type === "debit" || formData.type === "credit" ? formData.bank ?? null : null,
            debit_card_brand: formData.type === "debit" ? formData.debit_card_brand ?? null : null,
            last_four_digits: (formData.type === "debit" || formData.type === "credit" || formData.type === "investment") ? (formData.last_four_digits && /^\d{1,4}$/.test(formData.last_four_digits) ? formData.last_four_digits : null) : null,
            credit_mode: formData.type === "credit" ? formData.credit_mode ?? null : null,
            card_brand: formData.type === "credit" ? formData.card_brand ?? null : null,
            cut_off_day: formData.type === "credit" ? formData.cut_off_day ?? null : null,
            payment_due_day: formData.type === "credit" ? formData.payment_due_day ?? null : null,
            credit_limit: formData.type === "credit" ? formData.credit_limit ?? null : null,
            cash_advance_limit: formData.type === "credit" ? formData.cash_advance_limit ?? null : null,
            purchase_interest_rate: formData.type === "credit" ? formData.purchase_interest_rate ?? null : null,
            cash_advance_interest_rate: formData.type === "credit" ? formData.cash_advance_interest_rate ?? null : null,
            investment_yield_rate: formData.type === "investment" ? formData.investment_yield_rate ?? null : null,
            investment_term: formData.type === "investment" ? formData.investment_term ?? null : null,
            investment_start_date: formData.type === "investment" ? formData.investment_start_date ?? null : null,
        };
        const { data: created, error } = await supabase
            .from("wallets")
            .insert(insertPayload)
            .select("*")
            .single();

        if (error) {
            const msg = error.message || "Error al crear cuenta";
            if (msg.toLowerCase().includes("schema cache") || msg.toLowerCase().includes("column") && msg.toLowerCase().includes("not found")) {
                return { error: "Hubo un problema con la caché de la base de datos (columna no encontrada). Por favor, intenta de nuevo en unos momentos o recarga la configuración de Supabase si eres el administrador." };
            }
            throw new Error(msg);
        }
        if (created && isAppwriteConfigured()) {
            syncWalletToAppwrite(created as Wallet).catch(() => { });
        }
    } catch (err) {
        if (isAppwriteConfigured() && isNetworkOrServerError(err)) {
            const userId = await getUserIdForFailover();
            if (!userId) return { error: "No autenticado. Inicia sesión de nuevo cuando Supabase esté disponible." };
            try {
                await createWalletInAppwrite(userId, formData);
            } catch (appwriteErr) {
                return { error: (appwriteErr instanceof Error ? appwriteErr.message : "Error al crear cuenta en respaldo") };
            }
        } else {
            return { error: err instanceof Error ? err.message : "Error al crear cuenta" };
        }
    }
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function updateWallet(
    id: string,
    formData: {
        name: string;
        type: "cash" | "debit" | "credit" | "investment";
        currency: string;
        balance?: number;
        color?: string | null;
        bank?: string | null;
        debit_card_brand?: string | null;
        last_four_digits?: string | null;
        credit_mode?: "account" | "card";
        card_brand?: string;
        cut_off_day?: number;
        payment_due_day?: number;
        credit_limit?: number;
        cash_advance_limit?: number;
        purchase_interest_rate?: number;
        cash_advance_interest_rate?: number;
        investment_yield_rate?: number;
        investment_term?: string;
        investment_start_date?: string;
    }
) {
    const parsed = walletSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const updateData: Record<string, string | number | null> = {
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        balance: formData.balance ?? null,
        color: formData.color || null,
    };
    const lastFour = formData.last_four_digits && /^\d{1,4}$/.test(formData.last_four_digits) ? formData.last_four_digits : null;
    if (formData.type === "debit") {
        updateData.bank = formData.bank ?? null;
        updateData.debit_card_brand = formData.debit_card_brand ?? null;
        updateData.last_four_digits = lastFour;
        updateData.credit_mode = null;
        updateData.card_brand = null;
        updateData.cut_off_day = null;
        updateData.payment_due_day = null;
        updateData.credit_limit = null;
        updateData.cash_advance_limit = null;
        updateData.purchase_interest_rate = null;
        updateData.cash_advance_interest_rate = null;
    } else if (formData.type === "credit") {
        updateData.bank = formData.bank ?? null;
        updateData.last_four_digits = lastFour;
        updateData.credit_mode = formData.credit_mode ?? null;
        updateData.card_brand = formData.card_brand ?? null;
        updateData.cut_off_day = formData.cut_off_day ?? null;
        updateData.payment_due_day = formData.payment_due_day ?? null;
        updateData.credit_limit = formData.credit_limit ?? null;
        updateData.cash_advance_limit = formData.cash_advance_limit ?? null;
        updateData.purchase_interest_rate = formData.purchase_interest_rate ?? null;
        updateData.cash_advance_interest_rate = formData.cash_advance_interest_rate ?? null;
        updateData.debit_card_brand = null;
    } else {
        updateData.bank = null;
        updateData.debit_card_brand = null;
        updateData.last_four_digits = null;
        updateData.credit_mode = null;
        updateData.card_brand = null;
        updateData.cut_off_day = null;
        updateData.payment_due_day = null;
        updateData.credit_limit = null;
        updateData.cash_advance_limit = null;
        updateData.purchase_interest_rate = null;
        updateData.cash_advance_interest_rate = null;
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "No autenticado" };

        const { data: updated, error } = await supabase
            .from("wallets")
            .update(updateData)
            .eq("id", id)
            .eq("user_id", user.id)
            .select("*")
            .single();

        if (error) throw new Error(error.message);
        if (updated && isAppwriteConfigured()) {
            updateWalletInAppwrite(updated as Wallet).catch(() => { });
        }
    } catch (err) {
        if (isAppwriteConfigured() && isNetworkOrServerError(err)) {
            try {
                await updateWalletPartialInAppwrite(id, updateData);
            } catch (appwriteErr) {
                return { error: appwriteErr instanceof Error ? appwriteErr.message : "Error al actualizar en respaldo" };
            }
        } else {
            return { error: err instanceof Error ? err.message : "Error al actualizar cuenta" };
        }
    }
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function deleteWallet(id: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "No autenticado" };

        const { error } = await supabase
            .from("wallets")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw new Error(error.message);
        if (isAppwriteConfigured()) {
            deleteWalletFromAppwrite(id).catch(() => { });
        }
    } catch (err) {
        if (isAppwriteConfigured() && isNetworkOrServerError(err)) {
            try {
                await deleteWalletFromAppwrite(id);
            } catch (appwriteErr) {
                return { error: appwriteErr instanceof Error ? appwriteErr.message : "Error al eliminar en respaldo" };
            }
        } else {
            return { error: err instanceof Error ? err.message : "Error al eliminar cuenta" };
        }
    }
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function payCreditCard(params: {
    from_wallet_id: string;
    to_wallet_id: string;
    amount: number;
    description?: string;
    date?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const date = params.date || new Date().toISOString().slice(0, 10);

    // 1. Transfer funds (internal)
    const { data: transferId, error: transferError } = await supabase.rpc("transfer_between_wallets", {
        p_from_wallet_id: params.from_wallet_id,
        p_to_wallet_id: params.to_wallet_id,
        p_amount: params.amount,
        p_description: params.description || "Pago Tarjeta de Crédito",
    });

    if (transferError) return { error: transferError.message };

    // 2. Create the associated expense (to track it as money spent)
    // Note: The transfer just moves money between accounts, but paying a credit card debt
    // is often treated as the moment the expense "hits" the cash flow if not tracked otherwise.
    // However, usually items bought WITH the card are expenses. 
    // The user explicitly asked for: "al realizar un pago de una obligacion ... se cree automaticamente un gasto"
    // So we record an expense here.

    // Fetch credit card name for description
    const { data: ccWallet } = await supabase.from("wallets").select("name, currency").eq("id", params.to_wallet_id).single();

    const { error: expenseError } = await supabase.from("expenses").insert({
        user_id: user.id,
        amount: params.amount,
        currency: ccWallet?.currency || "COP",
        expense_priority: "obligatory",
        description: `Pago Tarjeta: ${ccWallet?.name || ""}`,
        date: date,
        wallet_id: params.from_wallet_id,
        // We don't deduct balance again because the transfer already did it for from_wallet
        // and increased it for to_wallet (credit card balance is usually negative/liability).
    });

    if (expenseError) return { error: expenseError.message };

    revalidatePath("/wallets");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { data: transferId, error: null };
}

export async function transferBetweenWallets(params: {
    from_wallet_id: string;
    to_wallet_id: string;
    amount: number;
    description?: string;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Use RPC for atomic transaction
    const { data: transferId, error } = await supabase.rpc("transfer_between_wallets", {
        p_from_wallet_id: params.from_wallet_id,
        p_to_wallet_id: params.to_wallet_id,
        p_amount: params.amount,
        p_description: params.description ?? "",
    });

    if (error) return { error: error.message };

    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    return { data: transferId, error: null };
}

export async function getWalletTransfers() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("wallet_transfers")
        .select(`
            *,
            from_wallet:wallets!from_wallet_id(name),
            to_wallet:wallets!to_wallet_id(name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
}

export type WalletMovement =
    | { kind: "income"; id: string; date: string; amount: number; description?: string | null; category?: string; walletName?: string }
    | { kind: "expense"; id: string; date: string; amount: number; description?: string | null; category?: string; walletName?: string }
    | { kind: "transfer_out"; id: string; date: string; amount: number; description?: string | null; toWalletName?: string; walletName?: string }
    | { kind: "transfer_in"; id: string; date: string; amount: number; description?: string | null; fromWalletName?: string; walletName?: string }
    | { kind: "investment"; id: string; date: string; amount: number; description?: string | null; goalName?: string; walletName?: string };

export async function getAllMovementsHistory(
    options?: { limit?: number; fromDate?: string; toDate?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const toDate = options?.toDate ?? new Date().toISOString().slice(0, 10);
    const from = options?.fromDate ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const limit = options?.limit ?? 200;

    const [incomesRes, expensesRes, transfersRes, savingsRes] = await Promise.all([
        supabase
            .from("incomes")
            .select("id, date, amount, description, category:categories(name), wallet:wallets(name)")
            .eq("user_id", user.id)
            .gte("date", from)
            .lte("date", toDate)
            .order("date", { ascending: false })
            .limit(limit),
        supabase
            .from("expenses")
            .select("id, date, amount, description, category:categories(name), wallet:wallets(name)")
            .eq("user_id", user.id)
            .gte("date", from)
            .lte("date", toDate)
            .order("date", { ascending: false })
            .limit(limit),
        supabase
            .from("wallet_transfers")
            .select(`
                id, date, amount, description,
                from_wallet_id, to_wallet_id,
                from_wallet:wallets!from_wallet_id(name),
                to_wallet:wallets!to_wallet_id(name)
            `)
            .eq("user_id", user.id)
            .gte("date", from)
            .lte("date", toDate)
            .order("date", { ascending: false })
            .limit(limit),
        supabase
            .from("savings_transactions")
            .select(`
                id, date, amount, notes,
                savings_goal:savings_goals(name),
                wallet:wallets(name)
            `)
            .gte("date", from)
            .lte("date", toDate)
            .order("date", { ascending: false })
            .limit(limit),
    ]);

    const movements: WalletMovement[] = [];

    const getName = (n: { name: string } | { name: string }[] | null | undefined) =>
        n == null ? undefined : Array.isArray(n) ? n[0]?.name : n.name;

    type RelationName = { name: string } | { name: string }[] | null | undefined;

    (incomesRes.data ?? []).forEach((i) => {
        const row = i as { id: string; date: string; amount: number; description?: string | null; category?: RelationName; wallet?: RelationName };
        movements.push({
            kind: "income",
            id: row.id,
            date: row.date,
            amount: Number(row.amount),
            description: row.description ?? undefined,
            category: getName(row.category),
            walletName: getName(row.wallet),
        });
    });
    (expensesRes.data ?? []).forEach((e) => {
        const row = e as { id: string; date: string; amount: number; description?: string | null; category?: RelationName; wallet?: RelationName };
        movements.push({
            kind: "expense",
            id: row.id,
            date: row.date,
            amount: Number(row.amount),
            description: row.description ?? undefined,
            category: getName(row.category),
            walletName: getName(row.wallet),
        });
    });
    (transfersRes.data ?? []).forEach((t) => {
        const row = t as { id: string; date: string; amount: number; description?: string | null; from_wallet?: RelationName; to_wallet?: RelationName };
        movements.push({
            kind: "transfer_out",
            id: row.id,
            date: row.date,
            amount: Number(row.amount),
            description: row.description ?? undefined,
            toWalletName: getName(row.to_wallet),
            walletName: getName(row.from_wallet),
        });
    });
    (savingsRes.data ?? []).forEach((s) => {
        const row = s as { id: string; date: string; amount: number; notes?: string | null; savings_goal?: RelationName; wallet?: RelationName };
        movements.push({
            kind: "investment",
            id: row.id,
            date: row.date,
            amount: Number(row.amount),
            description: row.notes ?? undefined,
            goalName: getName(row.savings_goal),
            walletName: getName(row.wallet),
        });
    });

    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        data: movements.slice(0, limit),
        error: null,
    };
}

export async function getWalletMovementHistory(
    walletId: string,
    options?: { limit?: number; fromDate?: string; toDate?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], wallet: null, error: "No autenticado" };

    const { data: walletRow } = await supabase
        .from("wallets")
        .select("id, name, currency")
        .eq("id", walletId)
        .eq("user_id", user.id)
        .single();
    if (!walletRow) return { data: [], wallet: null, error: "Cuenta no encontrada" };

    const toDate = options?.toDate ?? new Date().toISOString().slice(0, 10);
    const from = options?.fromDate ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const limit = options?.limit ?? 200;

    const [incomesRes, expensesRes, transfersRes] = await Promise.all([
        supabase
            .from("incomes")
            .select("id, date, amount, description, category:categories(name)")
            .eq("wallet_id", walletId)
            .gte("date", from)
            .lte("date", toDate)
            .order("date", { ascending: false })
            .limit(limit),
        supabase
            .from("expenses")
            .select("id, date, amount, description, category:categories(name)")
            .eq("wallet_id", walletId)
            .gte("date", from)
            .lte("date", toDate)
            .order("date", { ascending: false })
            .limit(limit),
        supabase
            .from("wallet_transfers")
            .select(`
                id, date, amount, description,
                from_wallet_id, to_wallet_id,
                from_wallet:wallets!from_wallet_id(name),
                to_wallet:wallets!to_wallet_id(name)
            `)
            .or(`from_wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`)
            .gte("date", from)
            .lte("date", toDate)
            .order("date", { ascending: false })
            .limit(limit),
    ]);

    const movements: WalletMovement[] = [];

    type CategoryRow = { id?: string; date?: string; amount?: number; description?: string | null; category?: { name: string } | { name: string }[] | null };
    const categoryName = (c: CategoryRow["category"]) =>
        c == null ? undefined : Array.isArray(c) ? c[0]?.name : c.name;

    (incomesRes.data ?? []).forEach((i: CategoryRow) => {
        movements.push({
            kind: "income",
            id: i.id!,
            date: i.date!,
            amount: Number(i.amount),
            description: i.description ?? undefined,
            category: categoryName(i.category),
        });
    });
    (expensesRes.data ?? []).forEach((e: CategoryRow) => {
        movements.push({
            kind: "expense",
            id: e.id!,
            date: e.date!,
            amount: Number(e.amount),
            description: e.description ?? undefined,
            category: categoryName(e.category),
        });
    });
    type WalletRef = { name: string } | { name: string }[] | null | undefined;
    const walletName = (w: WalletRef) => w == null ? undefined : Array.isArray(w) ? w[0]?.name : w.name;

    type TransferRow = {
        id: string; date: string; amount: number; description?: string | null;
        from_wallet_id: string; to_wallet_id: string;
        from_wallet?: WalletRef; to_wallet?: WalletRef;
    };
    (transfersRes.data ?? []).forEach((t: TransferRow) => {
        if (t.from_wallet_id === walletId) {
            movements.push({
                kind: "transfer_out",
                id: t.id,
                date: t.date,
                amount: Number(t.amount),
                description: t.description ?? undefined,
                toWalletName: walletName(t.to_wallet),
            });
        } else {
            movements.push({
                kind: "transfer_in",
                id: t.id,
                date: t.date,
                amount: Number(t.amount),
                description: t.description ?? undefined,
                fromWalletName: walletName(t.from_wallet),
            });
        }
    });

    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        data: movements.slice(0, limit),
        wallet: { id: walletRow.id, name: walletRow.name, currency: (walletRow as { currency?: string }).currency ?? "COP" },
        error: null,
    };
}
