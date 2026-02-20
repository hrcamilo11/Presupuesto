
const fs = require("fs");
const postgres = require("postgres");

// Read .env
const env = Object.fromEntries(
    fs
        .readFileSync(".env", "utf8")
        .split("\n")
        .filter((l) => l && !l.startsWith("#"))
        .map((l) => {
            const i = l.indexOf("=");
            return [
                l.slice(0, i).trim(),
                l.slice(i + 1).trim().replace(/^["']|["']$/g, ""),
            ];
        })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const pass = env.SUPABASE_DB_PASSWORD;
const ref = (url || "").match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!ref || !pass) {
    console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_DB_PASSWORD en .env");
    process.exit(1);
}

const connectionString = `postgresql://postgres:${encodeURIComponent(pass)}@db.${ref}.supabase.co:5432/postgres`;

console.log("Conectando a la base de datos...");

const sql = postgres(connectionString);

async function run() {
    try {
        console.log("Aplicando corrección de RLS para profiles...");

        await sql`
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    `;

        // Drop the new one if it exists from failed attempts, just in case
        await sql`
      DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
    `;

        await sql`
      CREATE POLICY "Authenticated users can view all profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (true);
    `;

        console.log("¡Política RLS actualizada correctamente!");
    } catch (err) {
        console.error("Error al aplicar la migración:", err);
    } finally {
        await sql.end();
    }
}

run();
