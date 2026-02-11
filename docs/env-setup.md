# Variables de entorno (.env) — qué poner y dónde obtenerlas

Copia `.env.example` a `.env` y rellena cada variable. **Nunca subas `.env` a Git** (ya está en `.gitignore`).

---

## Supabase

| Variable | Dónde obtenerla | Obligatorio |
|----------|------------------|-------------|
| **NEXT_PUBLIC_SUPABASE_URL** | [Supabase](https://supabase.com/dashboard) → tu proyecto → **Project Settings** → **API** → "Project URL" | Sí |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Misma página → "Project API keys" → **anon** (public) | Sí |
| **SUPABASE_DB_PASSWORD** | **Project Settings** → **Database** → "Database password" (la que definiste al crear el proyecto) | Solo si usas `npm run db:migrate` |
| **SUPABASE_SERVICE_ROLE_KEY** | **Project Settings** → **API** → "Project API keys" → **service_role** (secret). Solo para servidor; no exponer en el cliente | Sí (notificaciones a otros usuarios y cron) |

---

## URL de la app

| Variable | Qué poner | Obligatorio |
|----------|-----------|-------------|
| **NEXT_PUBLIC_APP_URL** | En local: `http://localhost:3000`. En producción: `https://presupuesto.cfd` | Recomendado (enlaces en correos e invitaciones) |

---

## Correo (Resend)

| Variable | Dónde obtenerla | Obligatorio |
|----------|------------------|-------------|
| **RESEND_API_KEY** | [resend.com](https://resend.com) → **API Keys** → crear clave → copiar (empieza por `re_`) | Solo si quieres enviar correos desde la app |
| **RESEND_FROM_EMAIL** | Con dominio presupuesto.cfd (verificado en Resend): `Presupuesto <notificaciones@presupuesto.cfd>`. Para pruebas: `Presupuesto <onboarding@resend.dev>` | Opcional |

Si usas comillas: `RESEND_FROM_EMAIL="Presupuesto <notificaciones@presupuesto.cfd>"`

---

## Notificaciones push (Web Push)

| Variable | Dónde obtenerla | Obligatorio |
|----------|------------------|-------------|
| **VAPID_PUBLIC_KEY** | Generar un par de claves: [attheminute.com/vapid-key-generator](https://www.attheminute.com/vapid-key-generator) o en terminal: `npx web-push generate-vapid-keys`. Copiar la **Public Key** | Solo si quieres notificaciones push |
| **VAPID_PRIVATE_KEY** | La **Private Key** del mismo par. No subirla a Git ni compartirla | Solo si quieres notificaciones push |

---

## Cron (recordatorios diarios)

| Variable | Dónde obtenerla | Obligatorio |
|----------|------------------|-------------|
| **CRON_SECRET** | Inventa una contraseña larga y aleatoria (ej. `openssl rand -hex 32`). La pones también en Vercel como variable de entorno para que el cron pueda llamar a `/api/cron/notifications` | Solo si usas el cron en Vercel |

En Vercel: **Project** → **Settings** → **Environment Variables** → añadir `CRON_SECRET` con el mismo valor. El cron de Vercel enviará `Authorization: Bearer <CRON_SECRET>` automáticamente si la variable existe.

---

## Resumen mínimo para desarrollo

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://presupuesto.cfd   # en local: http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # para notificaciones a otros y cron
RESEND_API_KEY=re_...              # para correo de prueba/notificaciones
RESEND_FROM_EMAIL="Presupuesto <notificaciones@presupuesto.cfd>"   # verifica el dominio en Resend
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
CRON_SECRET=...                    # solo si vas a probar el cron
```

Si falta **SUPABASE_SERVICE_ROLE_KEY**, la app funcionará pero fallarán: “nuevo miembro en cuenta compartida” (notificar al dueño) y el cron de recordatorios.
