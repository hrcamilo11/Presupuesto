#!/usr/bin/env node
/**
 * Crea en Appwrite todas las colecciones definidas en appwrite-schema.js
 * (equivalente a "ejecutar las migraciones" de Supabase en Appwrite).
 *
 * Requiere en .env: NEXT_PUBLIC_APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 *
 * Uso: node scripts/appwrite-setup-schema.js
 *      npm run appwrite:setup
 */
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const { Client, Databases } = require("node-appwrite");
const { COLLECTIONS } = require("./appwrite-schema.js");

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

if (!endpoint || !projectId || !apiKey) {
  console.error("Faltan en .env: NEXT_PUBLIC_APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createAttribute(databases, databaseId, collectionId, att) {
  const { key, type, size = 255, required = false } = att;
  switch (type) {
    case "string":
      return databases.createStringAttribute(databaseId, collectionId, key, size, required);
    case "integer":
      return databases.createIntegerAttribute(databaseId, collectionId, key, required);
    case "float":
      return databases.createFloatAttribute(databaseId, collectionId, key, required);
    case "datetime":
      return databases.createDatetimeAttribute(databaseId, collectionId, key, required);
    default:
      throw new Error(`Tipo no soportado: ${type}`);
  }
}

async function ensureCollection(databaseId, collectionId, name, attributes) {
  try {
    await databases.getCollection(databaseId, collectionId);
    console.log(`  [OK] La colección '${collectionId}' ya existe.`);
    return;
  } catch (e) {
    if (e.code !== 404) throw e;
  }

  console.log(`  Creando colección '${collectionId}'...`);
  await databases.createCollection(databaseId, collectionId, name);

  for (const att of attributes) {
    try {
      await createAttribute(databases, databaseId, collectionId, att);
      console.log(`    Atributo: ${att.key}`);
      await sleep(300);
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log(`    Atributo ya existe: ${att.key}`);
      } else {
        throw err;
      }
    }
  }
  console.log(`  [OK] Colección '${collectionId}' creada.`);
}

async function main() {
  console.log("Esquema Appwrite (equivalente a migraciones Supabase)\n");
  console.log("Base de datos:", databaseId);
  console.log("Colecciones a crear:", COLLECTIONS.length, "\n");

  for (const coll of COLLECTIONS) {
    await ensureCollection(databaseId, coll.id, coll.name, coll.attributes);
    await sleep(500);
  }

  console.log("\nListo. Todas las colecciones están creadas en Appwrite.");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
