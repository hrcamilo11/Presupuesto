#!/usr/bin/env node
/**
 * Applies pending SQL migrations via Supabase JS client (service role).
 * Uses the Supabase REST API's rpc or a custom exec function.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

const env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
            const i = l.indexOf('=');
            const key = l.slice(0, i).trim();
            const val = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
            return [key, val];
        })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
});

// Migrations to apply in order
const migrations = [
    '20260218000008_fix_loan_payments_rls.sql',
    '20260220000000_fix_profiles_rls.sql',
];

async function applyMigration(filename) {
    const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    const sql = readFileSync(filepath, 'utf8');

    console.log(`\n=== Applying: ${filename} ===`);

    // Split on semicolons to execute statements separately
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
        const fullStmt = stmt + ';';
        console.log(`  Running: ${fullStmt.slice(0, 80).replace(/\n/g, ' ')}...`);

        const { error } = await supabase.rpc('exec_sql', { sql: fullStmt }).catch(() => ({ error: { message: 'RPC not available' } }));

        if (error && error.message !== 'RPC not available') {
            // Try as direct query via the Management API approach
            const res = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'POST',
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ query: fullStmt }),
            });
            console.log(`  Response status: ${res.status}`);
        } else if (!error) {
            console.log('  ✅ OK');
        }
    }
}

// Try Supabase Management API (requires personal access token, not service role)
async function tryManagementAPI(sql) {
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) return false;

    const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    console.log(`Trying Management API: ${url}`);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
    });

    const text = await res.text();
    console.log(`Management API response (${res.status}): ${text.slice(0, 200)}`);
    return res.ok;
}

async function main() {
    console.log(`Connected to: ${supabaseUrl}`);

    // Test connection
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
        console.error('Connection test failed:', error.message);
        process.exit(1);
    }
    console.log('✅ Connection OK');

    // Try Management API with combined SQL
    for (const filename of migrations) {
        const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
        const sql = readFileSync(filepath, 'utf8');
        const ok = await tryManagementAPI(sql);
        if (ok) {
            console.log(`✅ ${filename} applied via Management API`);
        } else {
            console.log(`⚠️  ${filename} - Management API unavailable, migration must be applied manually in Supabase Dashboard → SQL Editor`);
            console.log('\n--- SQL to run manually ---');
            console.log(sql);
            console.log('--- end ---\n');
        }
    }
}

main().catch(console.error);
