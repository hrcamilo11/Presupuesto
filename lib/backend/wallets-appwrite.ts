"use server";

import { Query } from "node-appwrite";
import type { Wallet } from "@/lib/database.types";
import {
  getAppwriteDatabases,
  getAppwriteDatabaseId,
  getWalletsCollectionId,
} from "@/lib/appwrite/client";

type AppwriteDoc = Record<string, unknown> & { $id: string };

function docToWallet(doc: AppwriteDoc): Wallet {
  return {
    id: doc.$id as string,
    user_id: (doc.user_id as string) ?? "",
    name: (doc.name as string) ?? "",
    type: (doc.type as Wallet["type"]) ?? "cash",
    currency: (doc.currency as string) ?? "COP",
    balance: Number(doc.balance ?? 0),
    color: (doc.color as string) ?? null,
    bank: (doc.bank as string) ?? null,
    debit_card_brand: (doc.debit_card_brand as string) ?? null,
    last_four_digits: (doc.last_four_digits as string) ?? null,
    credit_mode: (doc.credit_mode as Wallet["credit_mode"]) ?? null,
    card_brand: (doc.card_brand as string) ?? null,
    cut_off_day: (doc.cut_off_day as number) ?? null,
    payment_due_day: (doc.payment_due_day as number) ?? null,
    credit_limit: (doc.credit_limit as number) ?? null,
    cash_advance_limit: (doc.cash_advance_limit as number) ?? null,
    purchase_interest_rate: (doc.purchase_interest_rate as number) ?? null,
    investment_yield_rate: (doc.investment_yield_rate as number) ?? null,
    investment_term: (doc.investment_term as string) ?? null,
    investment_start_date: (doc.investment_start_date as string) ?? null,
    created_at: (doc.created_at as string) ?? new Date().toISOString(),
    updated_at: (doc.updated_at as string) ?? new Date().toISOString(),
  };
}

function walletToData(wallet: Partial<Wallet> & { user_id: string; name: string; type: string; currency: string; balance: number }): Record<string, unknown> {
  const data: Record<string, unknown> = {
    user_id: wallet.user_id,
    name: wallet.name,
    type: wallet.type,
    currency: wallet.currency,
    balance: wallet.balance,
  };
  if (wallet.color != null) data.color = wallet.color;
  if (wallet.bank != null) data.bank = wallet.bank;
  if (wallet.debit_card_brand != null) data.debit_card_brand = wallet.debit_card_brand;
  if (wallet.last_four_digits != null) data.last_four_digits = wallet.last_four_digits;
  if (wallet.credit_mode != null) data.credit_mode = wallet.credit_mode;
  if (wallet.card_brand != null) data.card_brand = wallet.card_brand;
  if (wallet.cut_off_day != null) data.cut_off_day = wallet.cut_off_day;
  if (wallet.payment_due_day != null) data.payment_due_day = wallet.payment_due_day;
  if (wallet.credit_limit != null) data.credit_limit = wallet.credit_limit;
  if (wallet.cash_advance_limit != null) data.cash_advance_limit = wallet.cash_advance_limit;
  if (wallet.purchase_interest_rate != null) data.purchase_interest_rate = wallet.purchase_interest_rate;
  if (wallet.cash_advance_interest_rate != null) data.cash_advance_interest_rate = wallet.cash_advance_interest_rate;
  if (wallet.investment_yield_rate != null) data.investment_yield_rate = wallet.investment_yield_rate;
  if (wallet.investment_term != null) data.investment_term = wallet.investment_term;
  if (wallet.investment_start_date != null) data.investment_start_date = wallet.investment_start_date;
  const now = new Date().toISOString();
  data.updated_at = wallet.updated_at ?? now;
  if (wallet.created_at != null) data.created_at = wallet.created_at;
  return data;
}

export async function getWalletsFromAppwrite(userId: string): Promise<Wallet[]> {
  const db = getAppwriteDatabases();
  if (!db) return [];
  const databaseId = getAppwriteDatabaseId();
  const collectionId = getWalletsCollectionId();
  const { documents } = await db.listDocuments(databaseId, collectionId, [
    Query.equal("user_id", userId),
    Query.orderAsc("created_at"),
  ]);
  return documents.map((d) => docToWallet(d as AppwriteDoc));
}

export async function syncWalletToAppwrite(wallet: Wallet): Promise<void> {
  const db = getAppwriteDatabases();
  if (!db) return;
  const databaseId = getAppwriteDatabaseId();
  const collectionId = getWalletsCollectionId();
  const data = walletToData(wallet);
  try {
    await db.createDocument(databaseId, collectionId, wallet.id, data);
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "";
    if (msg.includes("already exists") || msg.includes("duplicate")) {
      await db.updateDocument(databaseId, collectionId, wallet.id, data);
    } else {
      throw e;
    }
  }
}

export async function updateWalletInAppwrite(wallet: Wallet): Promise<void> {
  const db = getAppwriteDatabases();
  if (!db) return;
  const databaseId = getAppwriteDatabaseId();
  const collectionId = getWalletsCollectionId();
  const data = walletToData(wallet);
  await db.updateDocument(databaseId, collectionId, wallet.id, data);
}

export async function deleteWalletFromAppwrite(walletId: string): Promise<void> {
  const db = getAppwriteDatabases();
  if (!db) return;
  const databaseId = getAppwriteDatabaseId();
  const collectionId = getWalletsCollectionId();
  await db.deleteDocument(databaseId, collectionId, walletId);
}

/** FormData para crear wallet (mismo shape que createWallet en actions) */
export type CreateWalletFormData = {
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
};

/** Crea una wallet solo en Appwrite (fallback cuando Supabase está caído). Devuelve la wallet creada. */
export async function createWalletInAppwrite(userId: string, formData: CreateWalletFormData): Promise<Wallet> {
  const db = getAppwriteDatabases();
  if (!db) throw new Error("Appwrite no configurado");
  const databaseId = getAppwriteDatabaseId();
  const collectionId = getWalletsCollectionId();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const wallet: Wallet = {
    id,
    user_id: userId,
    name: formData.name,
    type: formData.type,
    currency: formData.currency,
    balance: formData.balance ?? 0,
    color: formData.color ?? null,
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
    investment_yield_rate: formData.type === "investment" ? formData.investment_yield_rate ?? null : null,
    investment_term: formData.type === "investment" ? formData.investment_term ?? null : null,
    investment_start_date: formData.type === "investment" ? formData.investment_start_date ?? null : null,
    created_at: now,
    updated_at: now,
  };
  const data = walletToData(wallet);
  await db.createDocument(databaseId, collectionId, id, data);
  return wallet;
}

/** Actualiza una wallet en Appwrite con datos parciales (fallback cuando Supabase está caído). */
export async function updateWalletPartialInAppwrite(
  walletId: string,
  data: Record<string, string | number | null>
): Promise<void> {
  const db = getAppwriteDatabases();
  if (!db) return;
  const databaseId = getAppwriteDatabaseId();
  const collectionId = getWalletsCollectionId();
  const payload: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
  await db.updateDocument(databaseId, collectionId, walletId, payload);
}
