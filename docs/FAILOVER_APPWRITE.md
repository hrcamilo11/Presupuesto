# Failover Supabase ↔ Appwrite

Cuando Supabase no responde (timeout, 5xx), la app usa Appwrite como respaldo para las operaciones que estén implementadas.

## Requisitos

- **Supabase**: como siempre (Auth + Postgres). Sigue siendo el backend principal.
- **Appwrite**: proyecto en [Appwrite Cloud](https://cloud.appwrite.io) o self-hosted. Se usa solo cuando falla Supabase.

## Variables de entorno

En `.env` añade (opcional; si no están, el failover no se usa):

```env
# Appwrite (solo para failover cuando Supabase falle)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=tu-project-id
APPWRITE_API_KEY=tu-api-key
APPWRITE_DATABASE_ID=main
```

- **NEXT_PUBLIC_APPWRITE_ENDPOINT**: URL del servidor Appwrite (Cloud: `https://cloud.appwrite.io/v1`).
- **NEXT_PUBLIC_APPWRITE_PROJECT_ID**: mismo valor que `APPWRITE_PROJECT_ID`; se expone en el cliente para el login de respaldo (Appwrite Auth en el navegador).
- **APPWRITE_PROJECT_ID** y **APPWRITE_API_KEY**: desde el dashboard del proyecto → Settings → API Keys (crea una con permisos de Databases y, si usas auth de respaldo, de Users).
- **APPWRITE_DATABASE_ID**: ID de la base de datos que crees en Appwrite (ej. `main`).

## Configuración en Appwrite

1. Crea un **Database** en el dashboard (ej. nombre "Main", ID `main`).
2. Crea **todas** las colecciones equivalentes a las tablas de Supabase (el “esquema” en Appwrite) con:

```bash
npm run appwrite:setup
```

Este script crea en Appwrite las colecciones: `wallets`, `categories`, `tags`, `expenses`, `incomes`, `budgets`, `subscriptions`, `loans`, `tax_obligations`, `wallet_transfers`, `savings_goals`. Si una colección ya existe, la deja como está. Las variables de Appwrite se leen del `.env`.

Solo necesitas la colección **wallets** para el failover actual. Las demás quedan listas por si más adelante extiendes el failover a otros recursos.

Alternativa: crear solo la colección wallets con `npm run appwrite:create-wallets`.

### Atributos de la collection `wallets` (referencia)

| Atributo | Tipo   | Obligatorio |
|----------|--------|-------------|
| user_id  | string | sí          |
| name     | string | sí          |
| type     | string | sí          |
| currency | string | sí          |
| balance  | float  | sí          |
| color    | string | no          |
| bank     | string | no          |
| debit_card_brand | string | no |
| last_four_digits | string | no |
| credit_mode | string | no |
| card_brand | string | no |
| cut_off_day | integer | no |
| payment_due_day | integer | no |
| credit_limit | float | no |
| cash_advance_limit | float | no |
| purchase_interest_rate | float | no |
| cash_advance_interest_rate | float | no |
| created_at | string (datetime) | no |
| updated_at | string (datetime) | no |

**Permisos:** para acceso desde el servidor con API Key no hace falta dar permisos a "users"; la API key tiene acceso. Si usas Auth de Appwrite más adelante, ajusta permisos según la doc de Appwrite.

## Cómo funciona el failover

Cuando **Supabase está caído** (timeout, red, 5xx), la app usa **solo Appwrite** para wallets, para que puedas seguir trabajando.

1. **Lectura (getWallets)**  
   Se intenta Supabase. Si falla por red/timeout/5xx, se lee desde Appwrite usando el `user_id` de la cookie de sesión.

2. **Escritura (crear / editar / eliminar cuenta)**  
   - Si Supabase responde: se escribe en Supabase y además en Appwrite (doble escritura).  
   - Si Supabase falla (red/timeout/5xx): se escribe **solo en Appwrite** y la acción se da por correcta. Así puedes seguir creando, editando y eliminando cuentas aunque Supabase esté caído.

3. **Auth**  
   El usuario inicia sesión con Supabase. Tras el login se guarda `user_id` en una cookie para identificar al usuario cuando Supabase no esté disponible. Si Supabase está caído puedes usar **login con Appwrite** (mismo email/contraseña) y seguir entrando al dashboard. Ver más abajo.

---

## Auth y login con Appwrite cuando falla Supabase

Para poder **iniciar sesión** cuando Supabase no responde, la app puede usar Appwrite Auth como respaldo. Así sigues usando el mismo `user_id` (el de Supabase) en todos los datos.

### Requisitos

- **Appwrite Auth**: en el proyecto de Appwrite, Auth debe estar habilitado (por defecto lo está). No hace falta configuración extra.
- **Usuario creado en Appwrite al registrarse**: al darse de alta en Supabase, se crea el mismo usuario en Appwrite con el **mismo ID** (el `user.id` de Supabase). Así, al hacer login por Appwrite, `user.$id` es el `user_id` que usa la app.
- **Cookie de failover**: al hacer login por Appwrite se establece la misma cookie `sb_failover_uid` con ese ID. El middleware acepta rutas protegidas si hay esta cookie aunque no haya sesión de Supabase.

### Flujo de registro

1. El usuario se registra en Supabase (email, contraseña, nombre).
2. Si el registro en Supabase es correcto, una server action crea el mismo usuario en Appwrite con:
   - `userId` = `user.id` de Supabase (para que el ID sea único y coincida).
   - Mismo email, contraseña y nombre.
3. Si Appwrite no está configurado o falla, el registro en Supabase ya se dio por bueno; el usuario podrá entrar cuando Supabase vuelva. El login por Appwrite solo funcionará si en algún momento se creó el usuario en Appwrite (por ejemplo en un segundo intento o con un script de sincronización).

### Flujo de login con fallback a Appwrite

1. Se intenta primero `signInWithPassword` con Supabase.
2. Si Supabase responde con error (red, timeout, 5xx o cualquier fallo), se intenta login con Appwrite:
   - En el cliente se usa el SDK de Appwrite (`Account.createEmailPasswordSession`) con el mismo email y contraseña.
   - Si Appwrite devuelve sesión, se llama a una server action que guarda en cookie el ID del usuario de Appwrite (que es el mismo que el de Supabase).
   - Redirección al dashboard.
3. El middleware permite acceso a `/dashboard` y rutas protegidas si existe la cookie `sb_failover_uid`, aunque no haya sesión de Supabase.

### Configuración en el proyecto

- **Variables de entorno**: las mismas de Appwrite (incluida `NEXT_PUBLIC_APPWRITE_ENDPOINT` para el cliente).
- **Paquete cliente**: se usa el paquete `appwrite` (SDK para navegador) en la página de login para el fallback. El servidor sigue usando `node-appwrite`.
- **Server actions**:
  - `createAppwriteUser(supabaseUserId, email, password, name?)`: crea usuario en Appwrite con `userId = supabaseUserId`. Se llama tras un registro en Supabase correcto.
  - `setFailoverCookieFromAppwriteUserId(appwriteUserId)`: establece la cookie `sb_failover_uid` con el valor indicado (en este flujo, el ID de Appwrite es el mismo que el de Supabase).

### Usuarios ya existentes (registrados antes del failover)

Quienes se registraron antes de tener Appwrite configurado no tendrán usuario en Appwrite. Para ellos el login por Appwrite fallará hasta que:
- se ejecute un script que cree en Appwrite los usuarios existentes de Supabase (con el mismo ID y contraseña que tendrían que resetear/establecer), o  
- se implemente una pantalla de “activar respaldo” que, con sesión Supabase válida, cree el usuario en Appwrite con la contraseña actual.

## Extender el failover a más recursos

Para añadir failover a más tablas (expenses, incomes, etc.):

1. Crea la colección correspondiente en Appwrite con los mismos atributos que la tabla en Postgres.
2. Añade en `lib/backend/` un módulo tipo `wallets-appwrite.ts` que lea/escriba esa colección.
3. En las server actions, usa `withFailover(supabaseFn, appwriteFn)` para lectura y doble escritura en create/update/delete.

## Limitaciones

- **Auth**: Si Supabase está caído, puedes iniciar sesión con Appwrite (mismo email/contraseña) si el usuario fue creado en Appwrite (p. ej. se registró cuando el failover estaba configurado). La sesión se identifica con la cookie de failover.
- **RPC/funciones**: Las funciones de Postgres (ej. `transfer_between_wallets`, `adjust_wallet_balance`) no están replicadas en Appwrite; las acciones que dependan de ellas en fallback no están implementadas.
- **Sincronización**: Appwrite se rellena por doble escritura desde Supabase. Cuando Supabase vuelve a estar operativo, puedes migrar los datos que quedaron en Appwrite de vuelta a Supabase (ver más abajo).

---

## Migrar datos de Appwrite a Supabase

Cuando Supabase vuelve a funcionar con normalidad, puedes **traer a Supabase** los datos que se escribieron solo en Appwrite (o que quieras unificar).

### Script de migración

```bash
npm run appwrite:migrate-to-supabase
```

Requisitos en `.env`:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Appwrite**: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID` (opcional, por defecto `main`)

El script:

1. Lee todos los documentos de cada colección en Appwrite (wallets, categories, tags, expenses, incomes, budgets, subscriptions, loans, tax_obligations, wallet_transfers, savings_goals).
2. Para cada documento cuyo `$id` es un **UUID válido**, hace **upsert** en la tabla homónima de Supabase (por `id`). Así no se duplican filas y se actualizan las que ya existían.
3. Respeta el orden de dependencias (por ejemplo wallets antes que expenses) para no violar claves foráneas.

Solo se migran documentos con `$id` en formato UUID (los que la app suele usar cuando escribe en Appwrite). Si alguna fila falla (por ejemplo `user_id` no existe en `auth.users`), ese error se registra y se sigue con el resto.

### Sincronizar Supabase → Appwrite

Para **copiar los datos de Supabase a Appwrite** (por ejemplo para tener respaldo o dejar Appwrite listo por si Supabase falla):

```bash
npm run appwrite:sync-from-supabase
```

Requisitos: las mismas variables que arriba (Supabase con service role y Appwrite).

El script lee cada tabla de Supabase (wallets, categories, tags, etc.), y por cada fila crea o actualiza el documento en la colección homónima de Appwrite usando el `id` de la fila como `documentId`. Si el documento ya existe en Appwrite, se actualiza. Así puedes dejar Appwrite poblado con los mismos datos que Supabase.
