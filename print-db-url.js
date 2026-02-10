const fs = require("fs");

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

console.log(
  `postgresql://postgres:${encodeURIComponent(
    pass
  )}@db.${ref}.supabase.co:5432/postgres`
);

