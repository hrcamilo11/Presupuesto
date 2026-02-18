const dns = require("dns").promises;
const { readFileSync, existsSync } = require("fs");
const postgres = require("postgres");
const path = require("path");

async function applyMigration() {
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

    // Intentar forzar IPv4 si es una URL de Supabase
    let dbUrl = env.SUPABASE_DB_URL;
    try {
        const url = new URL(dbUrl);
        const host = url.hostname;
        const { address } = await dns.lookup(host, { family: 4 });
        url.hostname = address;
        dbUrl = url.toString();
        console.log(`Host resuelto a IPv4: ${address}`);
    } catch (e) {
        console.warn("No se pudo resolver el host a IPv4, usando URL original:", e.message);
    }

    const sql = postgres(dbUrl, {
        ssl: "require",
        connect_timeout: 10
    });

    console.log("Aplicando migración de username en signup...");
    const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "20260218000003_username_in_signup.sql");
    const migrationSql = readFileSync(migrationPath, "utf8");

    try {
        await sql.unsafe(migrationSql);
        console.log("Migración aplicada exitosamente.");
    } catch (error) {
        console.error("Error aplicando migración:", error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

applyMigration();
