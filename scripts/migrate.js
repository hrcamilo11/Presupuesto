#!/usr/bin/env node
/**
 * Ejecuta las migraciones de Supabase contra el proyecto remoto.
 * Requiere SUPABASE_DB_PASSWORD en .env (Supabase Dashboard > Settings > Database).
 *
 * Si tu red no puede conectar a db.xxx.supabase.co (timeout IPv6), usa la URL del
 * pooler: Dashboard → Connect → "Session mode" → copia la URI tal cual y en .env
 * pon SUPABASE_DB_URL= esa URI reemplazando solo [YOUR-PASSWORD] por tu contraseña.
 * Si la contraseña tiene @ # : / etc., codifícala (ej. @ → %40). El host debe ser
 * el que muestra el Dashboard (región correcta, ej. aws-0-sa-east-1 o aws-0-us-east-1).
 */
const { readFileSync, existsSync } = require("fs");
const { execSync } = require("child_process");
const path = require("path");

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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const password = env.SUPABASE_DB_PASSWORD;

if (!url) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL en .env");
  process.exit(1);
}

const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
const projectRef = match ? match[1] : null;
if (!projectRef) {
  console.error("No se pudo extraer project ref de la URL");
  process.exit(1);
}

// Preferir URL explícita del pooler (Session mode) si existe; evita timeouts por IPv6
const explicitDbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;
let dbUrl;
if (explicitDbUrl && explicitDbUrl.startsWith("postgres")) {
  dbUrl = explicitDbUrl.replace(/^postgres:/, "postgresql:");
  if (dbUrl.includes("[YOUR-PASSWORD]") && password) {
    dbUrl = dbUrl.replace("[YOUR-PASSWORD]", encodeURIComponent(password));
  }
} else {
  if (!password) {
    console.error(
      "Falta SUPABASE_DB_PASSWORD en .env.\nObtén la contraseña en: Supabase Dashboard > Project Settings > Database > Database password"
    );
    process.exit(1);
  }
  const encodedPassword = encodeURIComponent(password);
  dbUrl = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:6543/postgres`;
}

const workdir = path.join(__dirname, "..");
try {
  execSync(`npx supabase db push --db-url "${dbUrl}"`, {
    stdio: "inherit",
    cwd: workdir,
  });
  console.log("Migración aplicada correctamente.");
} catch (e) {
  process.exit(e.status ?? 1);
}
