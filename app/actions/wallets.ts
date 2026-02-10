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
    });

    if (error) return { error: error.message };
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
        balance?: number; // Only if we allow manual balance adjustment which might break consistency if not careful, but maybe helpful for corrections.
    }
) {
    // For now, allow checking balance updates directly ??? 
    // Usually balance is calculated, but my schema stores it.
    // Let's allow name/type updates. Balance updates should be transactions?
    // User requested "correct logic". 
    // Modifying balance manually is "Adjustment".

    const parsed = walletSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("wallets")
        .update({
            name: formData.name,
            type: formData.type,
            currency: formData.currency,
            // balance: formData.balance, // CAREFUL. If we allow this, we overwrite transaction history logic.
            // Better to NOT allow balance update here unless it's a "Correction" transaction.
            // For simplicity in this action, I will IGNORING balance updates or treat it as a reset?
            // "balance" is in the schema but maybe I should remove it from updateWallet for safety.
            // I'll leave it out for now to ensure consistency.
        })
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
