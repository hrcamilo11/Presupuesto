# Variables de Vercel para notificaciones

Añade estas variables en tu proyecto de Vercel para que funcionen el correo (Resend) y las notificaciones push.

## Desde el Dashboard

1. [Vercel](https://vercel.com) → tu proyecto **budget-tracker** → **Settings** → **Environment Variables**.
2. Crea cada variable. Para **Production**, **Preview** y **Development** según quieras (recomendado: las tres).

| Variable | Sensitive | Ejemplo / descripción |
|----------|-----------|------------------------|
| `RESEND_API_KEY` | Sí | `re_xxxx` (desde Resend) |
| `RESEND_FROM_EMAIL` | No | `Presupuesto <onboarding@resend.dev>` o tu dominio |
| `VAPID_PUBLIC_KEY` | No | Clave pública del generador VAPID |
| `VAPID_PRIVATE_KEY` | Sí | Clave privada VAPID (nunca la subas a Git) |
| `NEXT_PUBLIC_APP_URL` | No | `https://presupuesto.cfd` |

Guarda y redeploya para que se apliquen.

## Desde la CLI (Vercel CLI instalado y logueado)

En la raíz del proyecto:

```bash
# Añadir cada variable (te pedirá el valor y el entorno: Production / Preview / Development)
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
vercel env add VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

Puedes copiar los valores desde tu `.env` local. Después haz un nuevo deploy para que se usen los secrets.
