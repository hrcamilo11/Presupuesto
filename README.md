# Presupuesto — Rastreador de presupuesto personal

Aplicación para seguimiento de ingresos y gastos con Next.js, shadcn/ui y Supabase.

**URL de producción:** [https://presupuesto.cfd](https://presupuesto.cfd)

## Características

- **Autenticación:** registro, login, recuperar contraseña y reenviar correo de confirmación
- **Ingresos:** CRUD con tipos (mensual, irregular, ocasional) y filtro por mes
- **Gastos:** CRUD con prioridad (obligatorio, necesario, opcional) y filtro por mes
- **Suscripciones:** gastos recurrentes (mensual/anual), próximo pago y “marcar como pagado” (avanza la fecha)
- **Préstamos:** capital, tasa anual, plazo; tabla de amortización (método francés) y registro de pagos realizados
- **Impuestos:** obligaciones fiscales con vencimiento, periodo (mensual/trimestral/anual) y estado de pago
- **Dashboard:** resumen del mes (ingresos, gastos, balance), equivalente mensual de suscripciones, préstamos activos e impuestos pendientes

## Requisitos

- Node.js 18+ (recomendado 20+)
- Cuenta en [Supabase](https://supabase.com)

## Configuración

1. Clona el repo e instala dependencias:

   ```bash
   npm install
   ```

2. Crea un proyecto en Supabase y ejecuta las migraciones (en orden):

   - En **SQL Editor**, ejecuta primero `supabase/migrations/20250209000000_initial_schema.sql`
   - Luego ejecuta `supabase/migrations/20250210000000_subscriptions_loans_taxes.sql`
   - O usa `npm run db:migrate` si tienes `SUPABASE_DB_PASSWORD` en `.env`

3. Variables de entorno:

   - Copia `.env.example` a `.env.local`
   - Rellena con tu URL y anon key del proyecto Supabase (Settings → API):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000). Crea una cuenta en **Regístrate** y empieza a añadir ingresos y gastos.

### Configuración de autenticación en Supabase

Para que el registro y la confirmación por correo funcionen bien:

1. En el **Dashboard de Supabase** → **Authentication** → **URL Configuration**:
   - **Site URL** (producción): `https://presupuesto.cfd/auth/callback`
   - **Redirect URLs** — añade estas (en local y producción):
     - `http://localhost:3000`
     - `http://localhost:3000/auth/callback`
     - `https://presupuesto.cfd`
     - `https://presupuesto.cfd/auth/callback`
   - Para probar en local, cambia **Site URL** temporalmente a `http://localhost:3000/auth/callback`.

2. Opcional: en **Authentication** → **Providers** → **Email** puedes subir el tiempo de validez del enlace de confirmación.

- En **login** puedes usar **"¿Olvidaste tu contraseña?"** para recuperar acceso.
- El correo de confirmación solo se envía al **registrarte**; en la pantalla de éxito puedes **"Reenviar correo de confirmación"** si no lo recibes. Si el enlace caduca y vuelves a login, también podrás solicitar un nuevo enlace allí.

## Despliegue en Vercel

1. **Sube el código** a un repositorio en GitHub, GitLab o Bitbucket.

2. **Importa el proyecto en Vercel:**
   - Entra en [vercel.com](https://vercel.com) e inicia sesión.
   - **Add New** → **Project** → importa el repo de este proyecto.
   - Framework: **Next.js** (se detecta solo). No cambies el directorio raíz.

3. **Variables de entorno** (Settings → Environment Variables del proyecto):
   - `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon / public key de Supabase.
   - `NEXT_PUBLIC_APP_URL` — `https://presupuesto.cfd` (enlaces en correos, invitaciones y notificaciones).

4. **Dominio:** En el proyecto Vercel → **Settings** → **Domains** añade **presupuesto.cfd** y apunta el DNS del dominio a Vercel. La app se sirve en **https://presupuesto.cfd** (no uses la URL \*.vercel.app para producción).

5. **Deploy.** La app queda en **https://presupuesto.cfd**

**Alternativa con CLI:**

```bash
npm i -g vercel   # o: npx vercel
vercel login
vercel --prod
```

Cuando la CLI pida las variables de entorno, añade las de Supabase y `NEXT_PUBLIC_APP_URL=https://presupuesto.cfd`, o configúralas después en el dashboard del proyecto en Vercel.

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción
- `npm run lint` — ESLint
- `npm run db:migrate` — aplicar migraciones a Supabase (requiere `SUPABASE_DB_PASSWORD` en `.env`)

## Estructura

- `app/(auth)/` — login y registro
- `app/(dashboard)/` — dashboard, ingresos y gastos (rutas protegidas)
- `app/actions/` — server actions (CRUD)
- `components/ui/` — componentes shadcn
- `components/incomes/`, `components/expenses/` — formularios y listas
- `lib/supabase/` — cliente Supabase (browser, server, middleware)
- `lib/validations/` — esquemas Zod
- `lib/amortization.ts` — cuota mensual y tabla de amortización (préstamos)
- `supabase/migrations/` — SQL del esquema y RLS (inicial + suscripciones, préstamos, impuestos)
