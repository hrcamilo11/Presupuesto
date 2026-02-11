# Acción urgente: secretos expuestos en GitHub

Si tu archivo `.env` (o algún commit con secretos) llegó a GitHub, **debes hacer lo siguiente**.

## 1. Rotar todos los secretos (obligatorio)

Los secretos que estuvieron en el repo se consideran comprometidos. Genera nuevos y actualiza donde los uses.

### Supabase Service Role

1. Entra a [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto.
2. **Project Settings** → **API**.
3. En "Project API keys", busca **service_role**. Si hay opción de "Regenerate" o "Roll key", úsala. Si no, en algunos proyectos se crea una nueva clave y se invalida la anterior.
4. Copia la **nueva** clave y actualiza:
   - Tu `.env` local: `SUPABASE_SERVICE_ROLE_KEY=...`
   - Vercel → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY` (Production y Preview).

### Resend API Key

1. [resend.com](https://resend.com) → **API Keys**.
2. Revoca o elimina la clave que pudo quedar expuesta.
3. Crea una **nueva** API Key.
4. Actualiza `.env` local y Vercel: `RESEND_API_KEY=...`

### VAPID (Web Push)

1. Genera un nuevo par: [attheminute.com/vapid-key-generator](https://www.attheminute.com/vapid-key-generator) o `npx web-push generate-vapid-keys`.
2. Sustituye en `.env` y en Vercel: `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`.
3. Los usuarios que ya tenían push activado pueden tener que volver a "Activar notificaciones en este dispositivo" en Configuración.

### CRON_SECRET

1. Genera uno nuevo: `openssl rand -hex 32`.
2. Actualiza `.env` y en Vercel: `CRON_SECRET=...`

### Otras variables que hayan estado en .env

- **SUPABASE_DB_PASSWORD:** en Supabase → Project Settings → Database puedes cambiar la contraseña de la base de datos si la tenías en .env y crees que se expuso.
- **NEXT_PUBLIC_*** no son secretos (van al cliente), pero **NEXT_PUBLIC_SUPABASE_ANON_KEY** es pública por diseño; aun así, si Supabase te permite rotar la anon key, puedes hacerlo.

## 2. Evitar que .env se suba de nuevo

- **.gitignore** ya incluye `.env` y variantes. No quites esas líneas.
- Antes de cada `git add`, revisa con `git status` que no estés añadiendo `.env`.
- Si usas `git add .`, asegúrate de que `.env` no esté en la lista.

## 3. Quitar el archivo del historial de Git (opcional pero recomendado)

Aunque rotes los secretos, el archivo sigue en el historial. Cualquiera con acceso al repo podría ver valores antiguos.

### Opción A: BFG Repo-Cleaner (recomendado)

1. Instala [BFG](https://rtyley.github.io/bfg-repo-cleaner/).
2. Clona el repo con espejo:  
   `git clone --mirror https://github.com/TU-USUARIO/budget-tracker.git`
3. Ejecuta (sustituye la ruta):  
   `bfg --delete-files .env budget-tracker.git`
4. Entra a `budget-tracker.git` y ejecuta:  
   `git reflog expire --expire=now --all && git gc --prune=now --aggressive`
5. Push forzado:  
   `cd budget-tracker.git && git push --force`
6. En GitHub, si hay más ramas o PRs, puede que tengas que forzar push en cada una.

### Opción B: Nuevo repo sin historial (más drástico)

1. Crea un repo nuevo en GitHub.
2. En tu máquina (en una carpeta nueva):  
   `git clone https://github.com/TU-USUARIO/budget-tracker.git temp-clean && cd temp-clean`
3. Borra el historial y deja solo el estado actual:  
   `rm -rf .git && git init && git add . && git commit -m "Initial commit (historial limpio)"`
4. Añade el remoto nuevo y sube:  
   `git remote add origin https://github.com/TU-USUARIO/budget-tracker-nuevo.git && git push -u origin main`
5. Luego puedes renombrar repos o actualizar el remoto del proyecto original si lo prefieres.

### Opción C: Solo eliminar .env del último commit (si solo estaba ahí)

Si el `.env` se subió en el **último** commit y aún no has hecho push de más commits:

```bash
git rm --cached .env
git commit --amend -m "Remove .env from repo"
git push --force
```

Esto no borra el archivo de commits anteriores; para eso hace falta Opción A o B.

## 4. GitGuardian

- En la alerta de GitGuardian suele haber un botón para marcar el secreto como "revoked" o "resolved" después de rotarlo.
- Rotar los secretos y (si es posible) limpiar el historial reduce el riesgo y suele ser suficiente para dar el incidente por cerrado una vez hechos los pasos 1, 2 y 3.

## Resumen

1. **Rotar:** SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, VAPID, CRON_SECRET (y cualquier otro secreto que estuviera en .env).
2. **Actualizar** esos valores en `.env` local y en Vercel.
3. **Confirmar** que `.env` está en `.gitignore` y no se vuelve a commitear.
4. **Opcional:** Limpiar el historial con BFG o con un repo nuevo sin historial.
