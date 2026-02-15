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
    type: "cash" | "debit" | "credit" | "savings" | "investment";
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
            last_four_digits: formData.last_four_digits && /^\d{1,4}$/.test(formData.last_four_digits) ? formData.last_four_digits : null,
            credit_mode: formData.type === "credit" ? formData.credit_mode ?? null : null,
            card_brand: formData.type === "credit" ? formData.card_brand ?? null : null,
            cut_off_day: formData.type === "credit" ? formData.cut_off_day ?? null : null,
            payment_due_day: formData.type === "credit" ? formData.payment_due_day ?? null : null,
            credit_limit: formData.type === "credit" ? formData.credit_limit ?? null : null,
            cash_advance_limit: formData.type === "credit" ? formData.cash_advance_limit ?? null : null,
            purchase_interest_rate: formData.type === "credit" ? formData.purchase_interest_rate ?? null : null,
            cash_advance_interest_rate: formData.type === "credit" ? formData.cash_advance_interest_rate ?? null : null,
        };
        const { data: created, error } = await supabase
            .from("wallets")
            .insert(insertPayload)
            .select("*")
            .single();

        if (error) {
            const msg = error.message || "Error al crear cuenta";
            if (msg.includes("schema cache") && msg.includes("card_brand")) {
                return { error: "Tu Supabase aún no tiene aplicada la migración de tarjetas. Aplica las migraciones." };
            }
            throw new Error(msg);
        }
        if (created && isAppwriteConfigured()) {
            syncWalletToAppwrite(created as Wallet).catch(() => {});
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
        type: "cash" | "debit" | "credit" | "savings" | "investment";
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
            updateWalletInAppwrite(updated as Wallet).catch(() => {});
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
            deleteWalletFromAppwrite(id).catch(() => {});
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
    | { kind: "income"; id: string; date: string; amount: number; description?: string | null; category?: string }
    | { kind: "expense"; id: string; date: string; amount: number; description?: string | null; category?: string }
    | { kind: "transfer_out"; id: string; date: string; amount: number; description?: string | null; toWalletName?: string }
    | { kind: "transfer_in"; id: string; date: string; amount: number; description?: string | null; fromWalletName?: string };

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

    (incomesRes.data ?? []).forEach((i: { id: string; date: string; amount: number; description?: string | null; category?: { name: string } | null }) => {
        movements.push({
            kind: "income",
            id: i.id,
            date: i.date,
            amount: Number(i.amount),
            description: i.description ?? undefined,
            category: (i.category as { name: string } | null)?.name,
        });
    });
    (expensesRes.data ?? []).forEach((e: { id: string; date: string; amount: number; description?: string | null; category?: { name: string } | null }) => {
        movements.push({
            kind: "expense",
            id: e.id,
            date: e.date,
            amount: Number(e.amount),
            description: e.description ?? undefined,
            category: (e.category as { name: string } | null)?.name,
        });
    });
    (transfersRes.data ?? []).forEach((t: {
        id: string; date: string; amount: number; description?: string | null;
        from_wallet_id: string; to_wallet_id: string;
        from_wallet?: { name: string } | null; to_wallet?: { name: string } | null;
    }) => {
        if (t.from_wallet_id === walletId) {
            movements.push({
                kind: "transfer_out",
                id: t.id,
                date: t.date,
                amount: Number(t.amount),
                description: t.description ?? undefined,
                toWalletName: (t.to_wallet as { name: string } | null)?.name,
            });
        } else {
            movements.push({
                kind: "transfer_in",
                id: t.id,
                date: t.date,
                amount: Number(t.amount),
                description: t.description ?? undefined,
                fromWalletName: (t.from_wallet as { name: string } | null)?.name,
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
