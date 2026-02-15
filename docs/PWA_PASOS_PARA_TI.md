# PWA: pasos cuando te toque intervenir

La PWA ya está implementada (manifest, iconos placeholder, viewport, InstallPrompt, headers del SW). Lo que sigue depende de ti: iconos definitivos, pruebas y despliegue.

---

## 1. Iconos definitivos (opcional pero recomendado)

Ahora la app usa iconos placeholder (cuadros sólidos oscuros) en `public/icon-192x192.png` y `public/icon-512x512.png`.

**Qué hacer:**

- Sustituir esos archivos por tus iconos reales (192x192 y 512x512 px, PNG), **o**
- Generar iconos desde un logo/favicon con:
  - [PWABuilder Image Generator](https://www.pwabuilder.com/imageGenerator)
  - [RealFaviconGenerator](https://realfavicongenerator.net/)
- Si cambias de diseño, puedes volver a generar placeholders con:
  ```bash
  node scripts/generate-pwa-icons.js
  ```
  (puedes editar el color en el script si quieres otro fondo).

No hace falta tocar `app/manifest.ts`: ya apunta a `/icon-192x192.png` e `/icon-512x512.png`.

---

## 2. Probar la instalación en local (HTTPS)

La opción “Añadir a la pantalla de inicio” solo aparece si la app se sirve por **HTTPS**. En local:

```bash
npm run dev -- --experimental-https
```

Abre la URL que muestre Next (ej. `https://localhost:3000`) en el móvil (misma red) o en el navegador de escritorio y comprueba que:

- Se puede instalar (Chrome: menú → “Instalar aplicación” o banner; Safari iOS: Compartir → “Añadir a la pantalla de inicio”).
- El banner de instalación (InstallPrompt) se ve y se puede cerrar.

---

## 3. Desplegar con HTTPS

En producción la app **debe** estar en HTTPS para que la PWA sea instalable. La app se sirve en **https://presupuesto.cfd**. Si usas Vercel, Netlify o similar, normalmente ya tendrás HTTPS; asegúrate de usar el dominio presupuesto.cfd (no la URL \*.vercel.app).

---

## 4. Comprobaciones en dispositivos reales

Cuando tengas la app en producción (HTTPS):

- **Android (Chrome):** Abre la URL, comprueba que aparece “Añadir a la pantalla de inicio” (menú o banner). Instala y abre la app desde el icono.
- **iOS (Safari):** Abre la URL, toca Compartir → “Añadir a la pantalla de inicio”. Comprueba que el banner del InstallPrompt muestra las instrucciones correctas y que, una vez instalada, la app abre en modo standalone (sin barra del navegador).

---

## 5. Si quieres ocultar el banner de instalación en alguna ruta

El InstallPrompt está en el layout y se muestra en todas las páginas (salvo si ya está instalado o lo has cerrado y no han pasado 7 días). Si prefieres mostrarlo solo en ajustes o notificaciones:

- Quita `<InstallPrompt />` del [app/layout.tsx](../app/layout.tsx).
- Incluye `<InstallPrompt />` solo en la página que elijas (por ejemplo [app/(dashboard)/settings/page.tsx](../app/(dashboard)/settings/page.tsx) o la de notificaciones).

---

## Resumen rápido

| Qué | Acción |
|-----|--------|
| Iconos | Sustituir `public/icon-192x192.png` y `public/icon-512x512.png` por los definitivos (o generarlos con las herramientas indicadas). |
| Probar en local | `npm run dev -- --experimental-https` y abrir en HTTPS. |
| Producción | Desplegar con HTTPS en **https://presupuesto.cfd** (Vercel/Netlify ya lo dan al usar el dominio). |
| Validar | Probar “Instalar” en Android (Chrome) e iOS (Safari) con https://presupuesto.cfd. |

No hace falta tocar el plan ni el código de la PWA para esto; solo iconos, entorno HTTPS y pruebas en dispositivo.
