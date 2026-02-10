"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { walletSchema } from "@/lib/validations/wallet";

export async function getWallets() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
}

export async function createWallet(formData: {
    name: string;
    type: "cash" | "debit" | "credit" | "savings" | "investment";
    currency: string;
    balance?: number;
    color?: string | null;
    bank?: string | null;
    debit_card_brand?: string | null;
    credit_mode?: "account" | "card";
    card_brand?: string;
    cut_off_day?: number;
    credit_limit?: number;
    cash_advance_limit?: number;
    purchase_interest_rate?: number;
    cash_advance_interest_rate?: number;
}) {
    const parsed = walletSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase.from("wallets").insert({
        user_id: user.id,
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        balance: formData.balance || 0,
        color: formData.color || null,
        bank: formData.type === "debit" || formData.type === "credit" ? formData.bank ?? null : null,
        debit_card_brand: formData.type === "debit" ? formData.debit_card_brand ?? null : null,
        credit_mode: formData.type === "credit" ? formData.credit_mode ?? null : null,
        card_brand: formData.type === "credit" ? formData.card_brand ?? null : null,
        cut_off_day: formData.type === "credit" ? formData.cut_off_day ?? null : null,
        credit_limit: formData.type === "credit" ? formData.credit_limit ?? null : null,
        cash_advance_limit:
            formData.type === "credit" ? formData.cash_advance_limit ?? null : null,
        purchase_interest_rate:
            formData.type === "credit" ? formData.purchase_interest_rate ?? null : null,
        cash_advance_interest_rate:
            formData.type === "credit" ? formData.cash_advance_interest_rate ?? null : null,
    });

    if (error) {
        const msg = error.message || "Error al crear cuenta";
        if (msg.includes("schema cache") && msg.includes("card_brand")) {
            return {
                error:
                    "Tu Supabase aún no tiene aplicada la migración de tarjetas (columnas como card_brand, credit_limit, etc.) o el schema cache no se ha recargado. Aplica las migraciones y recarga el esquema, luego intenta de nuevo.",
            };
        }
        return { error: msg };
    }
    revalidatePath("/wallets"); // adjust path if needed
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
        credit_mode?: "account" | "card";
        card_brand?: string;
        cut_off_day?: number;
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

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const updateData: Record<string, string | number | null> = {
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        color: formData.color || null,
    };

    if (formData.type === "debit") {
        updateData.bank = formData.bank ?? null;
        updateData.debit_card_brand = formData.debit_card_brand ?? null;
        // Limpiar campos de crédito
        updateData.credit_mode = null;
        updateData.card_brand = null;
        updateData.cut_off_day = null;
        updateData.credit_limit = null;
        updateData.cash_advance_limit = null;
        updateData.purchase_interest_rate = null;
        updateData.cash_advance_interest_rate = null;
    } else if (formData.type === "credit") {
        updateData.bank = formData.bank ?? null;
        updateData.credit_mode = formData.credit_mode ?? null;
        updateData.card_brand = formData.card_brand ?? null;
        updateData.cut_off_day = formData.cut_off_day ?? null;
        updateData.credit_limit = formData.credit_limit ?? null;
        updateData.cash_advance_limit = formData.cash_advance_limit ?? null;
        updateData.purchase_interest_rate = formData.purchase_interest_rate ?? null;
        updateData.cash_advance_interest_rate = formData.cash_advance_interest_rate ?? null;
        // Limpiar campos de débito
        updateData.debit_card_brand = null;
    } else {
        // Limpiar campos de crédito y débito si cambia el tipo
        updateData.bank = null;
        updateData.debit_card_brand = null;
        updateData.credit_mode = null;
        updateData.card_brand = null;
        updateData.cut_off_day = null;
        updateData.credit_limit = null;
        updateData.cash_advance_limit = null;
        updateData.purchase_interest_rate = null;
        updateData.cash_advance_interest_rate = null;
    }

    const { error } = await supabase
        .from("wallets")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function deleteWallet(id: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("wallets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
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
