# Dominio presupuesto.cfd — checklist

La app en producción se sirve en **https://presupuesto.cfd**. Con este dominio configurado, todos los enlaces (invitaciones, notificaciones, correos) usarán esta URL. No uses la URL por defecto de Vercel (\*.vercel.app) para producción.

## 1. Vercel (donde se sirve la app)

1. [Vercel](https://vercel.com) → tu proyecto → **Settings** → **Domains**.
2. Añade **presupuesto.cfd** (y opcionalmente **www.presupuesto.cfd**).
3. Configura el DNS en tu registrador del dominio según lo que indique Vercel (registro A o CNAME hacia Vercel).
4. En **Environment Variables** del proyecto, define:
   - **NEXT_PUBLIC_APP_URL** = `https://presupuesto.cfd` (para Production y Preview si aplica).

## 2. Supabase (auth y redirects)

1. [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **Authentication** → **URL Configuration**.
2. **Site URL:** `https://presupuesto.cfd/auth/callback`
3. **Redirect URLs** — incluye:
   - `https://presupuesto.cfd`
   - `https://presupuesto.cfd/auth/callback`
   - (y en local: `http://localhost:3000`, `http://localhost:3000/auth/callback`)

Así el login, registro y “olvidé contraseña” redirigen bien a presupuesto.cfd.

## 3. Resend (correos desde tu dominio)

Para que los correos salgan como **notificaciones@presupuesto.cfd** (app y Supabase Auth):

1. [Resend](https://resend.com) → **Domains** → **Add Domain** → `presupuesto.cfd`.
2. Añade en tu registrador los registros DNS que Resend indique (MX, SPF, DKIM, etc.).
3. Cuando el dominio esté verificado:
   - En tu **.env** y en **Vercel**:  
     `RESEND_FROM_EMAIL="Presupuesto <notificaciones@presupuesto.cfd>"`
   - En **Supabase** → Authentication → SMTP: **Sender email** = `notificaciones@presupuesto.cfd`.

Hasta que verifiques el dominio, puedes seguir usando `onboarding@resend.dev` como remitente.

## 4. Variables de entorno y secrets

En **.env** local y en **Vercel** (Environment Variables):

| Variable | Valor en producción |
|----------|----------------------|
| **NEXT_PUBLIC_APP_URL** | `https://presupuesto.cfd` |
| **RESEND_FROM_EMAIL** | `Presupuesto <notificaciones@presupuesto.cfd>` (cuando el dominio esté verificado en Resend) |

El resto (SUPABASE_*, RESEND_API_KEY, VAPID_*, CRON_SECRET) se mantienen; no dependen del dominio.

## 5. Enlaces que ya usan el dominio

Con **NEXT_PUBLIC_APP_URL** = `https://presupuesto.cfd`:

- **Invitaciones a cuentas compartidas:** el enlace que se genera y envía ya usa `https://presupuesto.cfd/invite?token=...`.
- **Notificaciones por correo y push:** los enlaces “Ver en la app” apuntan a `https://presupuesto.cfd/...`.
- **Web Push (VAPID):** el contacto en el payload usa `mailto:notificaciones@presupuesto.cfd`.

No hace falta cambiar nada más en el código; solo la configuración anterior.
