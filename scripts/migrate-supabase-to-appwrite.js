#!/usr/bin/env node
/**
 * Migra datos desde Supabase hacia Appwrite (para tener respaldo o preparar failover).
 * Lee las tablas de Supabase y crea/actualiza documentos en las colecciones equivalentes de Appwrite.
 * Usa el id de la fila como documentId en Appwrite para mantener referencias.
 *
 * Requiere en .env:
 *   - Supabase: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Appwrite: NEXT_PUBLIC_APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 *
 * Uso: node scripts/migrate-supabase-to-appwrite.js
 *      npm run appwrite:sync-from-supabase
 */
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const { Client, Databases } = require("node-appwrite");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(__dirname, "..", ".env");
if (!existsSync(envPath)) {
  console.error("No se encontró .env");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      const key = l.slice(0, i).trim();
      const val = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      return [key, val];
    })
);

Object.entries(env).forEach(([k, v]) => { process.env[k] = v; });

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const appwriteEndpoint = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const appwriteProjectId = env.APPWRITE_PROJECT_ID;
const appwriteApiKey = env.APPWRITE_API_KEY;
const appwriteDatabaseId = env.APPWRITE_DATABASE_ID || "main";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}
if (!appwriteEndpoint || !appwriteProjectId || !appwriteApiKey) {
  console.error("Faltan variables de Appwrite en .env");
  process.exit(1);
}

function toStr(v) {
  if (v == null) return null;
  return String(v).trim() || null;
}
function toNum(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function toDateStr(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s.slice(0, 10) || null;
}
function toIso(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const appwriteClient = new Client()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId)
  .setKey(appwriteApiKey);
const databases = new Databases(appwriteClient);
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

const { COLLECTIONS } = require("./appwrite-schema.js");

const MIGRATION_ORDER = [
  "wallets",
  "categories",
  "tags",
  "subscriptions",
  "loans",
  "tax_obligations",
  "budgets",
  "savings_goals",
  "wallet_transfers",
  "incomes",
  "expenses",
];

/** Convierte una fila de Supabase a objeto de datos para Appwrite (solo atributos). */
function rowToDoc(tableName, row) {
  const r = { ...row };
  switch (tableName) {
    case "wallets":
      return {
        user_id: toStr(r.user_id) ?? "",
        name: toStr(r.name) ?? "",
        type: toStr(r.type) ?? "cash",
        currency: toStr(r.currency) ?? "COP",
        balance: toNum(r.balance) ?? 0,
        color: toStr(r.color),
        bank: toStr(r.bank),
        debit_card_brand: toStr(r.debit_card_brand),
        last_four_digits: toStr(r.last_four_digits),
        credit_mode: toStr(r.credit_mode),
        card_brand: toStr(r.card_brand),
        cut_off_day: toNum(r.cut_off_day),
        payment_due_day: toNum(r.payment_due_day),
        credit_limit: toNum(r.credit_limit),
        cash_advance_limit: toNum(r.cash_advance_limit),
        purchase_interest_rate: toNum(r.purchase_interest_rate),
        cash_advance_interest_rate: toNum(r.cash_advance_interest_rate),
        created_at: toIso(r.created_at),
        updated_at: toIso(r.updated_at),
      };
    case "categories":
      return {
        user_id: toStr(r.user_id) ?? "",
        shared_account_id: toStr(r.shared_account_id) || null,
        name: toStr(r.name) ?? "",
        icon: toStr(r.icon) ?? "Tag",
        color: toStr(r.color) ?? "#3b82f6",
        type: toStr(r.type) ?? "expense",
        created_at: toIso(r.created_at),
        updated_at: toIso(r.updated_at),
      };
    case "tags":
      return {
        user_id: toStr(r.user_id) ?? "",
        name: toStr(r.name) ?? "",
        color: toStr(r.color) ?? "#3b82f6",
        created_at: toIso(r.created_at),
      };
    case "expenses":
      return {
        user_id: toStr(r.user_id) ?? "",
        shared_account_id: toStr(r.shared_account_id) || null,
        wallet_id: toStr(r.wallet_id) || null,
        amount: toNum(r.amount) ?? 0,
        currency: toStr(r.currency) ?? "COP",
        expense_priority: toStr(r.expense_priority) ?? "optional",
        description: toStr(r.description) ?? "",
        date: toDateStr(r.date) ?? new Date().toISOString().slice(0, 10),
        category_id: toStr(r.category_id) || null,
        subscription_id: toStr(r.subscription_id) || null,
        loan_payment_id: toStr(r.loan_payment_id) || null,
        created_at: toIso(r.created_at),
      };
    case "incomes":
      return {
        user_id: toStr(r.user_id) ?? "",
        shared_account_id: toStr(r.shared_account_id) || null,
        wallet_id: toStr(r.wallet_id) || null,
        amount: toNum(r.amount) ?? 0,
        currency: toStr(r.currency) ?? "COP",
        income_type: toStr(r.income_type) ?? "monthly",
        description: toStr(r.description) ?? "",
        date: toDateStr(r.date) ?? new Date().toISOString().slice(0, 10),
        category_id: toStr(r.category_id) || null,
        created_at: toIso(r.created_at),
      };
    case "budgets":
      return {
        user_id: toStr(r.user_id) ?? "",
        category_id: toStr(r.category_id) || null,
        amount: toNum(r.amount) ?? 0,
        period: toStr(r.period) ?? "monthly",
        shared_account_id: toStr(r.shared_account_id) || null,
        created_at: toIso(r.created_at),
        updated_at: toIso(r.updated_at),
      };
    case "subscriptions":
      return {
        user_id: toStr(r.user_id) ?? "",
        shared_account_id: toStr(r.shared_account_id) || null,
        name: toStr(r.name) ?? "",
        amount: toNum(r.amount) ?? 0,
        currency: toStr(r.currency) ?? "COP",
        frequency: toStr(r.frequency) ?? "monthly",
        next_due_date: toDateStr(r.next_due_date) ?? new Date().toISOString().slice(0, 10),
        description: toStr(r.description) ?? "",
        created_at: toIso(r.created_at),
        updated_at: toIso(r.updated_at),
      };
    case "loans":
      return {
        user_id: toStr(r.user_id) ?? "",
        shared_account_id: toStr(r.shared_account_id) || null,
        name: toStr(r.name) ?? "",
        principal: toNum(r.principal) ?? 0,
        annual_interest_rate: toNum(r.annual_interest_rate) ?? 0,
        term_months: toNum(r.term_months) ?? 1,
        start_date: toDateStr(r.start_date) ?? new Date().toISOString().slice(0, 10),
        currency: toStr(r.currency) ?? "COP",
        description: toStr(r.description) ?? "",
        created_at: toIso(r.created_at),
      };
    case "tax_obligations":
      return {
        user_id: toStr(r.user_id) ?? "",
        shared_account_id: toStr(r.shared_account_id) || null,
        name: toStr(r.name) ?? "",
        amount: toNum(r.amount) ?? 0,
        currency: toStr(r.currency) ?? "COP",
        period_type: toStr(r.period_type) ?? "yearly",
        due_date: toDateStr(r.due_date) ?? new Date().toISOString().slice(0, 10),
        paid_at: toDateStr(r.paid_at),
        notes: toStr(r.notes) ?? "",
        created_at: toIso(r.created_at),
        updated_at: toIso(r.updated_at),
      };
    case "wallet_transfers":
      return {
        user_id: toStr(r.user_id) ?? "",
        from_wallet_id: toStr(r.from_wallet_id) ?? "",
        to_wallet_id: toStr(r.to_wallet_id) ?? "",
        amount: toNum(r.amount) ?? 0,
        description: toStr(r.description) ?? "",
        date: toIso(r.date) || new Date().toISOString(),
        created_at: toIso(r.created_at),
      };
    case "savings_goals":
      return {
        user_id: toStr(r.user_id) ?? "",
        shared_account_id: toStr(r.shared_account_id) || null,
        name: toStr(r.name) ?? "",
        target_amount: toNum(r.target_amount) ?? 0,
        current_amount: toNum(r.current_amount) ?? 0,
        target_date: toDateStr(r.target_date),
        type: toStr(r.type) ?? "manual",
        color: toStr(r.color) ?? "#3b82f6",
        icon: toStr(r.icon) || null,
        created_at: toIso(r.created_at),
        updated_at: toIso(r.updated_at),
      };
    default:
      return null;
  }
}

async function run() {
  console.log("Iniciando migración Supabase → Appwrite...\n");

  for (const tableName of MIGRATION_ORDER) {
    const exists = COLLECTIONS.some((c) => c.id === tableName);
    if (!exists) {
      console.log(`[omitido] ${tableName}: no hay colección en Appwrite.`);
      continue;
    }

    let rows = [];
    const { data, error: selectError } = await supabase.from(tableName).select("*");
    if (selectError) {
      console.error(`[error] ${tableName}: no se pudo leer (${selectError.message}).`);
      continue;
    }
    rows = data || [];

    if (rows.length === 0) {
      console.log(`[ok] ${tableName}: 0 filas.`);
      continue;
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const row of rows) {
      const id = row.id;
      if (!id) {
        failed++;
        continue;
      }
      const docData = rowToDoc(tableName, row);
      if (!docData) {
        failed++;
        continue;
      }

      try {
        await databases.createDocument(
          appwriteDatabaseId,
          tableName,
          id,
          docData
        );
        created++;
      } catch (err) {
        if (err.code === 409 || (err.message && err.message.includes("already exists"))) {
          try {
            await databases.updateDocument(
              appwriteDatabaseId,
              tableName,
              id,
              docData
            );
            updated++;
          } catch (upErr) {
            console.error(`  [error] ${tableName} ${id}: ${upErr.message}`);
            failed++;
          }
        } else {
          console.error(`  [error] ${tableName} ${id}: ${err.message}`);
          failed++;
        }
      }
    }

    console.log(`[ok] ${tableName}: ${created} creados, ${updated} actualizados${failed ? `, ${failed} fallidos` : ""}.`);
  }

  console.log("\nMigración finalizada.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
