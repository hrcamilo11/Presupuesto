#!/usr/bin/env node
/**
 * Migra datos desde Appwrite hacia Supabase (cuando Supabase vuelve a estar operativo).
 * Lee todas las colecciones definidas en appwrite-schema y hace upsert en las tablas
 * equivalentes de Supabase. Usa el $id del documento como id en Supabase cuando es un UUID válido.
 *
 * Requiere en .env:
 *   - Supabase: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Appwrite: NEXT_PUBLIC_APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 *
 * Uso: node scripts/migrate-appwrite-to-supabase.js
 *      npm run appwrite:migrate-to-supabase
 */
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const { Client, Databases, Query } = require("node-appwrite");
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

// Exponer env al proceso por si algún require lo usa
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
  console.error("Faltan variables de Appwrite en .env (NEXT_PUBLIC_APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY)");
  process.exit(1);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUUID(s) {
  return typeof s === "string" && UUID_REGEX.test(s);
}

function toNum(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function toStr(v) {
  if (v == null) return null;
  return String(v).trim() || null;
}
function toDate(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : s.slice(0, 10);
}
function toTimestamp(v) {
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

// Orden que respeta FKs: primero entidades que solo referencian auth.users, luego las que referencian otras tablas
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

function docToRow(collectionId, doc) {
  const id = doc.$id;
  if (!isUUID(id)) return null;
  const d = { ...doc };

  switch (collectionId) {
    case "wallets":
      return {
        id: id,
        user_id: toStr(d.user_id) || null,
        name: toStr(d.name) || "",
        type: (toStr(d.type) || "cash").toLowerCase(),
        currency: toStr(d.currency) || "COP",
        balance: toNum(d.balance) ?? 0,
        color: toStr(d.color),
        bank: toStr(d.bank),
        debit_card_brand: toStr(d.debit_card_brand),
        last_four_digits: toStr(d.last_four_digits),
        credit_mode: toStr(d.credit_mode),
        card_brand: toStr(d.card_brand),
        cut_off_day: toNum(d.cut_off_day),
        payment_due_day: toNum(d.payment_due_day),
        credit_limit: toNum(d.credit_limit),
        cash_advance_limit: toNum(d.cash_advance_limit),
        purchase_interest_rate: toNum(d.purchase_interest_rate),
        cash_advance_interest_rate: toNum(d.cash_advance_interest_rate),
        created_at: toTimestamp(d.created_at),
        updated_at: toTimestamp(d.updated_at),
      };
    case "categories":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        shared_account_id: toStr(d.shared_account_id) && isUUID(d.shared_account_id) ? d.shared_account_id : null,
        name: toStr(d.name) || "",
        icon: toStr(d.icon) || "Tag",
        color: toStr(d.color) || "#3b82f6",
        type: (toStr(d.type) || "expense").toLowerCase(),
        created_at: toTimestamp(d.created_at),
        updated_at: toTimestamp(d.updated_at),
      };
    case "tags":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        name: toStr(d.name) || "",
        color: toStr(d.color) || "#3b82f6",
        created_at: toTimestamp(d.created_at),
      };
    case "expenses":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        shared_account_id: toStr(d.shared_account_id) && isUUID(d.shared_account_id) ? d.shared_account_id : null,
        wallet_id: toStr(d.wallet_id) && isUUID(d.wallet_id) ? d.wallet_id : null,
        amount: toNum(d.amount) ?? 0,
        currency: toStr(d.currency) || "COP",
        expense_priority: (toStr(d.expense_priority) || "optional").toLowerCase(),
        description: toStr(d.description) || "",
        date: toDate(d.date) || new Date().toISOString().slice(0, 10),
        category_id: toStr(d.category_id) && isUUID(d.category_id) ? d.category_id : null,
        subscription_id: toStr(d.subscription_id) && isUUID(d.subscription_id) ? d.subscription_id : null,
        loan_payment_id: toStr(d.loan_payment_id) && isUUID(d.loan_payment_id) ? d.loan_payment_id : null,
        created_at: toTimestamp(d.created_at),
      };
    case "incomes":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        shared_account_id: toStr(d.shared_account_id) && isUUID(d.shared_account_id) ? d.shared_account_id : null,
        wallet_id: toStr(d.wallet_id) && isUUID(d.wallet_id) ? d.wallet_id : null,
        amount: toNum(d.amount) ?? 0,
        currency: toStr(d.currency) || "COP",
        income_type: (toStr(d.income_type) || "monthly").toLowerCase(),
        description: toStr(d.description) || "",
        date: toDate(d.date) || new Date().toISOString().slice(0, 10),
        category_id: toStr(d.category_id) && isUUID(d.category_id) ? d.category_id : null,
        created_at: toTimestamp(d.created_at),
      };
    case "budgets":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        category_id: toStr(d.category_id) && isUUID(d.category_id) ? d.category_id : null,
        amount: toNum(d.amount) ?? 0,
        period: toStr(d.period) || "monthly",
        shared_account_id: toStr(d.shared_account_id) && isUUID(d.shared_account_id) ? d.shared_account_id : null,
        created_at: toTimestamp(d.created_at),
        updated_at: toTimestamp(d.updated_at),
      };
    case "subscriptions":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        shared_account_id: toStr(d.shared_account_id) && isUUID(d.shared_account_id) ? d.shared_account_id : null,
        name: toStr(d.name) || "",
        amount: toNum(d.amount) ?? 0,
        currency: toStr(d.currency) || "COP",
        frequency: (toStr(d.frequency) || "monthly").toLowerCase(),
        next_due_date: toDate(d.next_due_date) || new Date().toISOString().slice(0, 10),
        description: toStr(d.description) || "",
        created_at: toTimestamp(d.created_at),
        updated_at: toTimestamp(d.updated_at),
      };
    case "loans":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        shared_account_id: toStr(d.shared_account_id) && isUUID(d.shared_account_id) ? d.shared_account_id : null,
        name: toStr(d.name) || "",
        principal: toNum(d.principal) ?? 0,
        annual_interest_rate: toNum(d.annual_interest_rate) ?? 0,
        term_months: toNum(d.term_months) ?? 1,
        start_date: toDate(d.start_date) || new Date().toISOString().slice(0, 10),
        currency: toStr(d.currency) || "COP",
        description: toStr(d.description) || "",
        created_at: toTimestamp(d.created_at),
      };
    case "tax_obligations":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        shared_account_id: toStr(d.shared_account_id) && isUUID(d.shared_account_id) ? d.shared_account_id : null,
        name: toStr(d.name) || "",
        amount: toNum(d.amount) ?? 0,
        currency: toStr(d.currency) || "COP",
        period_type: (toStr(d.period_type) || "yearly").toLowerCase(),
        due_date: toDate(d.due_date) || new Date().toISOString().slice(0, 10),
        paid_at: toDate(d.paid_at),
        notes: toStr(d.notes) || "",
        created_at: toTimestamp(d.created_at),
        updated_at: toTimestamp(d.updated_at),
      };
    case "wallet_transfers":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        from_wallet_id: toStr(d.from_wallet_id) && isUUID(d.from_wallet_id) ? d.from_wallet_id : null,
        to_wallet_id: toStr(d.to_wallet_id) && isUUID(d.to_wallet_id) ? d.to_wallet_id : null,
        amount: toNum(d.amount) ?? 0,
        description: toStr(d.description) || "",
        date: toTimestamp(d.date) || new Date().toISOString(),
        created_at: toTimestamp(d.created_at),
      };
    case "savings_goals":
      return {
        id,
        user_id: toStr(d.user_id) || null,
        shared_account_id: toStr(d.shared_account_id) && isUUID(d.shared_account_id) ? d.shared_account_id : null,
        name: toStr(d.name) || "",
        target_amount: toNum(d.target_amount) ?? 0,
        current_amount: toNum(d.current_amount) ?? 0,
        target_date: toDate(d.target_date),
        type: (toStr(d.type) || "manual").toLowerCase(),
        color: toStr(d.color) || "#3b82f6",
        icon: toStr(d.icon) || null,
        created_at: toTimestamp(d.created_at),
        updated_at: toTimestamp(d.updated_at),
      };
    default:
      return null;
  }
}

async function listAllDocuments(collectionId) {
  const limit = 100;
  let offset = 0;
  const all = [];
  while (true) {
    const { documents, total } = await databases.listDocuments(
      appwriteDatabaseId,
      collectionId,
      [Query.limit(limit), Query.offset(offset)]
    );
    all.push(...documents);
    if (documents.length < limit || all.length >= total) break;
    offset += limit;
  }
  return all;
}

async function run() {
  console.log("Iniciando migración Appwrite → Supabase...\n");

  for (const collectionId of MIGRATION_ORDER) {
    const tableName = collectionId;
    const exists = COLLECTIONS.some((c) => c.id === collectionId);
    if (!exists) {
      console.log(`[omitido] ${collectionId}: no está en el esquema Appwrite.`);
      continue;
    }

    let documents;
    try {
      documents = await listAllDocuments(collectionId);
    } catch (err) {
      console.error(`[error] ${collectionId}: no se pudo listar (${err.message}).`);
      continue;
    }

    const rows = [];
    for (const doc of documents) {
      const row = docToRow(collectionId, doc);
      if (!row) continue;
      if (!row.user_id && ["wallets", "categories", "tags", "expenses", "incomes", "budgets", "subscriptions", "loans", "tax_obligations", "wallet_transfers", "savings_goals"].includes(collectionId)) continue;
      rows.push(row);
    }

    if (rows.length === 0) {
      console.log(`[ok] ${tableName}: 0 documentos (o sin IDs UUID válidos / user_id).`);
      continue;
    }

    const { error } = await supabase.from(tableName).upsert(rows, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`[error] ${tableName}: ${error.message}`);
      continue;
    }
    console.log(`[ok] ${tableName}: ${rows.length} fila(s) migrada(s).`);
  }

  console.log("\nMigración finalizada.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
