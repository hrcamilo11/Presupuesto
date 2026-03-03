"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NequiClient } from "@/lib/bank-providers/nequi";
import type { Wallet } from "@/lib/database.types";

interface NequiConfig {
  client_id: string;
  client_secret: string;
  phone_number: string;
}

export async function syncNequiTransactions(walletId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // 1. Fetch wallet and config
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("id", walletId)
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error(walletError?.message || "Cuenta no encontrada");
    }

    const config = (wallet as any).nequi_config as NequiConfig;
    if (!config || !config.client_id || !config.client_secret || !config.phone_number) {
      throw new Error("Configuración de Nequi incompleta para esta cuenta");
    }

    // 2. Initialize Nequi Client
    const nequi = new NequiClient(config.client_id, config.client_secret, config.phone_number);

    // 3. Fetch existing external_ids from this wallet to avoid duplicates
    const [{ data: existingIncomes }, { data: existingExpenses }] = await Promise.all([
      supabase.from("incomes").select("external_id").eq("wallet_id", walletId),
      supabase.from("expenses").select("external_id").eq("wallet_id", walletId),
    ]);

    const existingIds = new Set([
      ...(existingIncomes?.map(i => i.external_id) || []),
      ...(existingExpenses?.map(e => e.external_id) || [])
    ].filter(Boolean));

    // 4. Fetch movements (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const movements = await nequi.getMovements(startDate, endDate);

    // 5. Process movements
    let addedCount = 0;
    let skippedCount = 0;
    let balanceDelta = 0;

    for (const move of movements) {
      if (existingIds.has(move.id)) {
        skippedCount++;
        continue;
      }

      const amount = Math.abs(parseFloat(move.amount));
      const date = move.date.split('T')[0];
      const description = move.description || move.concept || "Sincronización Nequi";
      const externalId = move.id;

      if (move.type === 'CREDIT') {
        // Income
        const { error: insertError } = await supabase.from("incomes").insert({
          user_id: user.id,
          wallet_id: walletId,
          amount,
          currency: wallet.currency || "COP",
          income_type: "irregular",
          description,
          date,
          external_id: externalId,
        });

        if (insertError) {
          console.error("Error inserting income:", insertError);
          skippedCount++;
        } else {
          addedCount++;
          balanceDelta += amount;
        }
      } else {
        // Expense
        const { error: insertError } = await supabase.from("expenses").insert({
          user_id: user.id,
          wallet_id: walletId,
          amount,
          currency: wallet.currency || "COP",
          expense_priority: "necessary",
          description,
          date,
          external_id: externalId,
        });

        if (insertError) {
          console.error("Error inserting expense:", insertError);
          skippedCount++;
        } else {
          addedCount++;
          balanceDelta -= amount;
        }
      }
    }

    // 6. Adjust wallet balance if there are new transactions
    if (balanceDelta !== 0) {
      await supabase.rpc("adjust_wallet_balance", {
        p_wallet_id: walletId,
        p_delta: balanceDelta,
      });
    }

    // 7. Update last_synced_at
    await supabase.from("wallets").update({
      last_synced_at: new Date().toISOString()
    } as any).eq("id", walletId);

    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    revalidatePath(`/wallets/${walletId}`);

    return { 
      success: true, 
      addedCount, 
      skippedCount, 
      message: `Sincronización completada: ${addedCount} movimientos procesados.` 
    };

  } catch (err) {
    console.error("Sync Error:", err);
    return { error: err instanceof Error ? err.message : "Error desconocido durante la sincronización" };
  }
}
