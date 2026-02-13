#!/usr/bin/env node
/**
 * Crea la colección "wallets" en Appwrite con todos los atributos necesarios para el failover.
 * Requiere en .env: NEXT_PUBLIC_APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 *
 * Uso: node scripts/appwrite-create-wallets-collection.js
 */
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const { Client, Databases } = require("node-appwrite");

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

const endpoint = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = env.APPWRITE_PROJECT_ID;
const apiKey = env.APPWRITE_API_KEY;
const databaseId = env.APPWRITE_DATABASE_ID || "main";
const collectionId = "wallets";

if (!endpoint || !projectId || !apiKey) {
  console.error("Faltan variables en .env: NEXT_PUBLIC_APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  try {
    await databases.getCollection(databaseId, collectionId);
    console.log("La colección 'wallets' ya existe. Nada que hacer.");
    return;
  } catch (e) {
    if (e.code !== 404) throw e;
  }

  console.log("Creando colección 'wallets'...");
  await databases.createCollection(databaseId, collectionId, "Wallets");

  const str = (key, size = 255, required = false) =>
    databases.createStringAttribute(databaseId, collectionId, key, size, required);
  const int = (key, required = false) =>
    databases.createIntegerAttribute(databaseId, collectionId, key, required);
  const flt = (key, required = false) =>
    databases.createFloatAttribute(databaseId, collectionId, key, required);
  const dt = (key, required = false) =>
    databases.createDatetimeAttribute(databaseId, collectionId, key, required);

  const attributes = [
    { key: "user_id", create: () => str("user_id", 64, true) },
    { key: "name", create: () => str("name", 255, true) },
    { key: "type", create: () => str("type", 32, true) },
    { key: "currency", create: () => str("currency", 8, true) },
    { key: "balance", create: () => flt("balance", true) },
    { key: "color", create: () => str("color", 32, false) },
    { key: "bank", create: () => str("bank", 128, false) },
    { key: "debit_card_brand", create: () => str("debit_card_brand", 64, false) },
    { key: "last_four_digits", create: () => str("last_four_digits", 8, false) },
    { key: "credit_mode", create: () => str("credit_mode", 32, false) },
    { key: "card_brand", create: () => str("card_brand", 64, false) },
    { key: "cut_off_day", create: () => int("cut_off_day", false) },
    { key: "payment_due_day", create: () => int("payment_due_day", false) },
    { key: "credit_limit", create: () => flt("credit_limit", false) },
    { key: "cash_advance_limit", create: () => flt("cash_advance_limit", false) },
    { key: "purchase_interest_rate", create: () => flt("purchase_interest_rate", false) },
    { key: "cash_advance_interest_rate", create: () => flt("cash_advance_interest_rate", false) },
    { key: "created_at", create: () => dt("created_at", false) },
    { key: "updated_at", create: () => dt("updated_at", false) },
  ];

  for (const { key, create } of attributes) {
    try {
      await create();
      console.log("  Atributo creado:", key);
      await sleep(300);
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log("  Atributo ya existe:", key);
      } else {
        throw err;
      }
    }
  }

  console.log("Colección 'wallets' creada correctamente.");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
