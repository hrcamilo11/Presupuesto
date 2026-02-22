---
description: How to apply database migrations to the remote Supabase project
---

# Workflow: Apply DB Migrations

This project uses the Supabase CLI (installed as a devDependency) to manage database migrations.

## One-time Setup: Authenticate with Supabase

You need a **Personal Access Token (PAT)** — different from the service role key.

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **Generate new token** and copy it.
3. Run:

```bash
npx supabase login --token <YOUR_PAT>
```

4. Link the project:

```bash
npm run db:link
# or: npx supabase link --project-ref vzohoiwmjcuqhndsoazx
```

When prompted for the DB password, use the value of `SUPABASE_DB_PASSWORD` from your `.env` file.

## Applying Migrations

Once authenticated and linked, push all pending migrations:

```bash
npm run db:push
# or: npx supabase db push
```

## Checking Migration Status

```bash
npm run db:status
# or: npx supabase migration list
```

## Creating a New Migration

```bash
npx supabase migration new <migration_name>
```

This creates a new `.sql` file in `supabase/migrations/` with a timestamp prefix.

## Alternative: Supabase Dashboard SQL Editor

If CLI is unavailable (network issues), apply any `.sql` file manually at:
https://supabase.com/dashboard/project/vzohoiwmjcuqhndsoazx/sql/new

The file `scripts/pending-migrations.sql` always contains the latest pending SQL ready to paste.
