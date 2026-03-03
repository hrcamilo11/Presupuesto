"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { FloidClient } from "@/lib/bank-providers/floid";

/**
 * Saves the token received from Floid widget to the wallet configuration.
 */
export async function linkFloidAccount(walletId: string, accessToken: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("wallets")
      .update({
        nequi_config: {
          floid_token: accessToken,
          linked_at: new Date().toISOString()
        }
      })
      .eq("id", walletId);

    if (error) throw error;

    revalidatePath("/wallets");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al vincular con Floid";
    console.error("Error linking Floid account:", error);
    return { error: message };
  }
}

/**
 * Main synchronization action using Floid.
 */
export async function syncFloidTransactions(walletId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // 1. Get wallet and floid config
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("id", walletId)
      .single();

    if (!wallet) return { error: "Cuenta no encontrada" };
    
    const config = wallet.nequi_config as { floid_token?: string };
    if (!config?.floid_token) {
      return { error: "La cuenta no está vinculada con Floid" };
    }

    // 2. Fetch transactions from Floid
    const floid = new FloidClient();
    const transactions = await floid.getNequiTransactions(config.floid_token);

    if (transactions.length === 0) {
      return { message: "No se encontraron movimientos nuevos." };
    }

    let addedCount = 0;
    let balanceDelta = 0;

    // 3. Process and insert transactions
    for (const tx of transactions) {
      const externalId = `floid_${tx.id}`;

      if (tx.type === 'INCOME') {
        const { error } = await supabase.from("incomes").insert({
          user_id: user.id,
          wallet_id: walletId,
          amount: tx.amount,
          currency: wallet.currency || "COP",
          income_type: "irregular",
          description: tx.description,
          date: tx.date.split('T')[0],
          external_id: externalId
        });
        if (!error) {
          addedCount++;
          balanceDelta += tx.amount;
        }
      } else {
        const { error } = await supabase.from("expenses").insert({
          user_id: user.id,
          wallet_id: walletId,
          amount: tx.amount,
          currency: wallet.currency || "COP",
          expense_priority: "necessary",
          description: tx.description,
          date: tx.date.split('T')[0],
          external_id: externalId
        });
        if (!error) {
          addedCount++;
          balanceDelta -= tx.amount;
        }
      }
    }

    // 4. Update balance if needed
    if (balanceDelta !== 0) {
      await supabase.rpc("adjust_wallet_balance", {
        p_wallet_id: walletId,
        p_delta: balanceDelta,
      });
    }

    // 5. Update last synced timestamp
    await supabase
      .from("wallets")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", walletId);

    revalidatePath("/wallets");
    revalidatePath(`/wallets/${walletId}/history`);

    return { 
      success: true, 
      message: `Sincronización completa. Se agregaron ${addedCount} movimientos.` 
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al sincronizar con Floid";
    console.error("Floid sync error:", error);
    return { error: message };
  }
}
