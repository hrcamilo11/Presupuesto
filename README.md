# Presupuesto — Rastreador de presupuesto personal

Aplicación para seguimiento de ingresos y gastos con Next.js, shadcn/ui y Supabase.

## Características

- **Autenticación:** registro e inicio de sesión con Supabase Auth
- **Ingresos:** CRUD con tipos (mensual, irregular, ocasional) y filtro por mes
- **Gastos:** CRUD con prioridad (obligatorio, necesario, opcional) y filtro por mes
- **Dashboard:** resumen del mes actual (totales, balance, desglose por tipo y prioridad)

## Requisitos

- Node.js 18+ (recomendado 20+)
- Cuenta en [Supabase](https://supabase.com)

## Configuración

1. Clona el repo e instala dependencias:

   ```bash
   npm install
   ```

2. Crea un proyecto en Supabase y ejecuta la migración:

   - En el dashboard de Supabase, ve a **SQL Editor**
   - Copia y ejecuta el contenido de `supabase/migrations/20250209000000_initial_schema.sql`

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
   - **Site URL** (producción): `https://budget-tracker-wheat-tau.vercel.app/auth/callback`
   - **Redirect URLs** — añade estas (en local y producción):
     - `http://localhost:3000`
     - `http://localhost:3000/auth/callback`
     - `https://budget-tracker-wheat-tau.vercel.app`
     - `https://budget-tracker-wheat-tau.vercel.app/auth/callback`
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

4. **Deploy.** La app está en **https://budget-tracker-wheat-tau.vercel.app**

**Alternativa con CLI:**

```bash
npm i -g vercel   # o: npx vercel
vercel login
vercel --prod
```

Cuando la CLI pida las variables de entorno, añade las dos de Supabase o configúralas después en el dashboard del proyecto en Vercel.

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
- `supabase/migrations/` — SQL del esquema y RLS
