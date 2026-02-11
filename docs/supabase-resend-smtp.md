# Supabase Auth con Resend (SMTP)

Para que los correos de **Supabase Auth** (confirmación de registro, recuperar contraseña, cambio de email, etc.) se envíen con **Resend** en lugar del correo por defecto de Supabase:

## 1. Tener una API key de Resend

- Entra en [resend.com](https://resend.com) → **API Keys** y crea una clave.
- Guárdala; la usarás como “contraseña” SMTP.

## 2. Configurar SMTP en Supabase

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Ve a **Authentication** → **Providers** → **Email** (o **Project Settings** → **Auth** → **SMTP**).
3. Activa **Enable Custom SMTP**.
4. Rellena con los datos de Resend:

| Campo | Valor |
|-------|--------|
| **Sender email** | `notificaciones@presupuesto.cfd` (tras verificar presupuesto.cfd en Resend) o `onboarding@resend.dev` (pruebas) |
| **Sender name** | `Presupuesto` (opcional) |
| **Host** | `smtp.resend.com` |
| **Port** | `465` (recomendado) o `587` |
| **Username** | `resend` |
| **Password** | Tu **API Key** de Resend (la que creaste en el paso 1) |

5. Guarda los cambios.

## Puertos

- **465** – SMTPS (SSL implícito). Recomendado.
- **587** – STARTTLS. Alternativa si 465 falla.

## Dominio presupuesto.cfd

Para enviar como `notificaciones@presupuesto.cfd`:

1. En Resend: **Domains** → añade `presupuesto.cfd` y configura los registros DNS que indique Resend.
2. En Supabase SMTP, **Sender email**: `notificaciones@presupuesto.cfd`.

Referencia: [Resend – Send with SMTP](https://resend.com/docs/send-with-smtp).
