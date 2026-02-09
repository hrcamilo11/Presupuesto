#!/usr/bin/env node
/**
 * Ejecuta las migraciones de Supabase contra el proyecto remoto.
 * Requiere SUPABASE_DB_PASSWORD en .env (Supabase Dashboard > Settings > Database).
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

if (!password) {
  console.error(
    "Falta SUPABASE_DB_PASSWORD en .env.\nObtén la contraseña en: Supabase Dashboard > Project Settings > Database > Database password"
  );
  process.exit(1);
}

const encodedPassword = encodeURIComponent(password);
const dbUrl = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;

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
