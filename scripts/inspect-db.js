const postgres = require('postgres');

const dbUrl = "postgresql://postgres:NlyTLzO7lefMGGsC@db.vzohoiwmjcuqhndsoazx.supabase.co:5432/postgres";
const sql = postgres(dbUrl);

async function inspectSchema() {
  try {
    console.log("--- Checking Foreign Keys for shared_account_members ---");
    const fks = await sql`
      SELECT
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.key_column_usage AS kcu 
          JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = kcu.constraint_name 
      WHERE kcu.table_name = 'shared_account_members';
    `;
    console.table(fks);

    console.log("\n--- Checking if profiles exist for members ---");
    const profiles = await sql`
      SELECT sam.user_id, p.id as profile_id, p.full_name
      FROM public.shared_account_members sam
      LEFT JOIN public.profiles p ON sam.user_id = p.id
    `;
    console.table(profiles);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await sql.end();
  }
}

inspectSchema();
