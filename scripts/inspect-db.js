const postgres = require('postgres');

const dbUrl = "postgresql://postgres:NlyTLzO7lefMGGsC@db.vzohoiwmjcuqhndsoazx.supabase.co:5432/postgres";
const sql = postgres(dbUrl);

async function inspectFKs() {
  try {
    const tables = ['budgets', 'expense_comments', 'incomes', 'expenses', 'shared_account_members'];
    console.log(`--- Checking Foreign Keys for: ${tables.join(', ')} ---`);

    const fks = await sql`
      SELECT
          con.conname AS constraint_name,
          rel.relname AS table_name,
          att.attname AS column_name,
          frel.relname AS foreign_table_name,
          fatt.attname AS foreign_column_name
      FROM
          pg_constraint con
      JOIN
          pg_class rel ON rel.oid = con.conrelid
      JOIN
          pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
      JOIN
          pg_class frel ON frel.oid = con.confrelid
      JOIN
          pg_attribute fatt ON fatt.attrelid = frel.oid AND fatt.attnum = ANY(con.confkey)
      WHERE
          rel.relname = ANY(${tables})
          AND con.contype = 'f';
    `;
    console.table(fks);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await sql.end();
  }
}

inspectFKs();
