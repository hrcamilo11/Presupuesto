"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ParsedMovement {
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  reference?: string;
}

/**
 * Parses text pasted from Nequi app or PDF extracts.
 * Common formats:
 * - "Jan 10, 2024 Transferencia de... -$10.000"
 * - "10/01/2024 | Pago de servicios | -50.000"
 */
export async function parseNequiText(text: string): Promise<ParsedMovement[]> {
  const movements: ParsedMovement[] = [];
  const lines = text.split('\n');

  // Regex patterns for different Nequi formats
  // Pattern 1: DD/MM/YYYY | Description | - $ 10.000,00
  // Pattern 2: 15 Ene Envío de plata - $ 5.000
  // Pattern 3: Jan 10, 2024 - Name - Description - $100.00
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 5) continue;

    // 1. Extract amount
    // Matches: $ 10.000, -$50.000, 5,000.00, - 2.000
    const amountRegex = /(-?\s?\$?\s?[\d]{1,3}(\.[\d]{3})*(,\d{2})?)/g;
    const matches = Array.from(trimmedLine.matchAll(amountRegex));
    if (matches.length === 0) continue;

    // Usually the last amount in the line is the transaction amount (the other might be the balance)
    const lastMatch = matches[matches.length - 1][0];
    const rawAmount = lastMatch.replace(/[^\d,-]/g, '').replace(',', '.');
    const amount = Math.abs(parseFloat(rawAmount));
    if (isNaN(amount)) continue;

    // 2. Determine type
    const isExpense = trimmedLine.includes('-') || 
                      /envío|pago|retiro|compra|sacaste/i.test(trimmedLine);
    
    // 3. Extract date
    const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{1,2}\s+[a-zA-Z]{3,})|(\d{4}[-/]\d{1,2}[-/]\d{1,2})/;
    const dateMatch = trimmedLine.match(dateRegex);
    const dateStr = new Date().toISOString().split('T')[0];
    
    if (dateMatch) {
      // Basic normalization logic could go here
    }

    // 4. Extract description
    let description = trimmedLine
      .replace(lastMatch, '')
      .replace(dateMatch ? dateMatch[0] : '', '')
      .replace(/[|]/g, '')
      .trim();

    if (!description) description = isExpense ? "Gasto Nequi" : "Ingreso Nequi";

    movements.push({
      date: dateStr,
      description,
      amount,
      type: isExpense ? 'EXPENSE' : 'INCOME'
    });
  }

  return movements;
}

export async function importNequiMovements(walletId: string, movements: ParsedMovement[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("id", walletId)
      .single();

    if (!wallet) return { error: "Cuenta no encontrada" };

    let addedCount = 0;
    let balanceDelta = 0;

    for (const move of movements) {
      // Generate a simple deterministic external_id to avoid duplicates if imported twice
      const externalId = `manual_${move.date}_${move.amount}_${move.description.substring(0, 20)}`.replace(/\s+/g, '_');

      if (move.type === 'INCOME') {
        const { error } = await supabase.from("incomes").insert({
          user_id: user.id,
          wallet_id: walletId,
          amount: move.amount,
          currency: wallet.currency || "COP",
          income_type: "irregular",
          description: move.description,
          date: move.date,
          external_id: externalId
        });
        if (!error) {
          addedCount++;
          balanceDelta += move.amount;
        }
      } else {
        const { error } = await supabase.from("expenses").insert({
          user_id: user.id,
          wallet_id: walletId,
          amount: move.amount,
          currency: wallet.currency || "COP",
          expense_priority: "necessary",
          description: move.description,
          date: move.date,
          external_id: externalId
        });
        if (!error) {
          addedCount++;
          balanceDelta -= move.amount;
        }
      }
    }

    if (balanceDelta !== 0) {
      await supabase.rpc("adjust_wallet_balance", {
        p_wallet_id: walletId,
        p_delta: balanceDelta,
      });
    }

    revalidatePath("/wallets");
    return { success: true, addedCount };
  } catch (err) {
    console.error("Import error:", err);
    return { error: "Error al importar movimientos" };
  }
}
