# Funcionalidades por apartado — qué hay y qué falta

Documento de referencia sin modificar código. Fecha: 2026-02-13.

---

## 1. Dashboard

### Implementado
- Resumen del mes actual: ingresos, gastos, balance, tasa de ahorro.
- Selector de contexto (global / personal / cuenta compartida).
- Filtro por cuenta (wallet).
- Tarjetas de totales configurables por usuario (mostrar/ocultar).
- Vista previa de cuentas (wallets).
- Resumen de presupuestos vs gastado.
- Metas de ahorro personales y totales.
- Gráfico de tendencia (6 meses).
- Gráfico circular de ingresos por tipo.
- Gráfico circular de gastos por prioridad.
- Sección de deudas (préstamos, tarjetas, obligaciones).
- Distribución por categoría y etiqueta.
- Accesos rápidos (enlaces a agregar ingreso/gasto, etc.).
- Orden de secciones configurable en Configuración.
- Botón de exportar reporte mensual (CSV).
- Redirección según preferencias (contexto/cuenta por defecto).
- Procesamiento de ahorros recurrentes al cargar.

### Falta por desarrollar
- Filtro por rango de fechas (varios meses o año).
- Exportar reporte en PDF o con gráficos.
- Dashboard específico por cuenta compartida (hoy el contexto solo filtra datos).
- Recordatorios o alertas visibles en el dashboard (próximos vencimientos, presupuesto al límite).

---

## 2. Ingresos

### Implementado
- Listado por mes (año/mes por URL).
- Selector de mes (MonthPicker).
- Alta de ingreso: monto, tipo (mensual/irregular/ocasional), fecha, categoría, cuenta, descripción, cuenta compartida (opcional), etiquetas.
- Edición y eliminación.
- Vista tarjeta en pantallas pequeñas/medianas, tabla en escritorio.
- Modal de detalle al tocar una tarjeta (móvil).
- Total del mes.
- RLS: propios + de cuentas compartidas donde es miembro.

### Falta por desarrollar
- Filtro por “solo personales” / “solo de cuenta X” en la página (ahora se ven todos los que RLS permite).
- Filtro por categoría o etiqueta en el listado.
- Búsqueda por descripción.
- Ingresos recurrentes (plantilla o repetición automática).
- Importación desde CSV/Excel.
- Gráfico o resumen por categoría/tipo en la misma página.

---

## 3. Gastos

### Implementado
- Listado por mes (año/mes por URL; sin selector de mes en la UI).
- Alta de gasto: monto, prioridad, fecha, categoría, cuenta, descripción, cuenta compartida (opcional), etiquetas.
- Edición y eliminación.
- Comentarios por gasto (útil en cuentas compartidas).
- Vista tarjeta en pantallas pequeñas/medianas, tabla en escritorio.
- Modal de detalle con comentarios.
- Total del mes.
- Notificaciones al superar o acercarse al presupuesto (80 % / 100 %).
- Ajuste de saldo de cuenta al crear/editar/eliminar.
- RLS: propios + de cuentas compartidas.

### Falta por desarrollar
- Selector de mes en la página (MonthPicker como en Ingresos); el mes se usa por URL pero no hay navegación visible.
- Filtro por cuenta compartida / solo personales en la página.
- Filtro por categoría, etiqueta o prioridad.
- Búsqueda por descripción.
- Gastos recurrentes (desde suscripción ya existe; “gasto fijo mensual” genérico no).
- Importación desde CSV/Excel.
- Vinculación gasto ↔ factura/recibo (adjunto o enlace).

---

## 4. Presupuestos

### Implementado
- Listado de presupuestos (categoría, periodo, monto límite).
- Alta y edición por categoría y periodo (mensual o año-mes).
- Eliminación.
- Resumen en dashboard (gastado vs límite).
- Notificaciones al 80 % y al superar.
- Backend y RLS con soporte para `shared_account_id`.

### Falta por desarrollar
- UI para presupuestos por cuenta compartida (selector de grupo y listado/filtro por grupo).
- Vista tarjeta en móvil (ahora solo tabla).
- Histórico o comparativa mes a mes (cuánto gasté vs presupuesto en meses anteriores).
- Presupuesto por periodo anual o trimestral con desglose.
- Alertas configurables (por ejemplo “avisar al 50 %”).

---

## 5. Cuentas (Wallets)

### Implementado
- Listado de cuentas (efectivo, débito, crédito, ahorro, inversión).
- Alta con tipo, nombre, moneda, saldo, color, banco, últimos 4 dígitos.
- Tarjetas de crédito: corte, vencimiento, límite, tasas, marca.
- Edición y eliminación.
- Transferencias entre cuentas (RPC atómica; soporte crédito como deuda).
- Pago de tarjeta de crédito (flujo específico).
- Ajuste de saldo automático al registrar ingresos/gastos/transferencias/préstamos.
- Creación automática de “Efectivo” si el usuario no tiene cuentas.
- Respaldo/fallback en Appwrite cuando Supabase no está disponible.

### Falta por desarrollar
- Vista de historial de movimientos por cuenta (solo se ve saldo; movimientos están en ingresos/gastos/transferencias).
- Conciliación (marcar movimientos como conciliados con el banco).
- Cuentas compartidas (cuentas vinculadas a un grupo).
- Múltiples monedas con tipo de cambio.
- Archivo adjunto o nota por transferencia.

---

## 6. Ahorros

### Implementado
- Metas personales: crear, contribuir, eliminar.
- Metas con tipo (emergency, purchase, travel, etc.), color, icono, fecha objetivo.
- Planes recurrentes (desde una cuenta, monto y frecuencia); se procesan al cargar dashboard.
- Contribución manual desde una cuenta (RPC que actualiza saldo de cuenta y meta).
- Metas grupales (por cuenta compartida): crear, contribuir, ver.
- Pestañas “Personales” y “Grupales”.
- Notificación al alcanzar la meta.
- RLS para propias y de cuentas compartidas.

### Falta por desarrollar
- Retiros parciales o cierre de meta con reintegro a cuenta (solo contribuciones y eliminación de meta).
- Historial de contribuciones por meta (solo saldo actual).
- Gráfico de avance en el tiempo (progreso mes a mes).
- Recordatorio para contribuir (notificación o recordatorio en dashboard).
- Metas con aportes automáticos desde nómina o cuenta (más allá del plan recurrente actual).

---

## 7. Préstamos

### Implementado
- Listado de préstamos (personales y por cuenta compartida).
- Alta: nombre, principal, tasa anual, plazo en meses, fecha inicio, moneda, descripción.
- Edición y eliminación.
- Tabla de amortización (cálculo de cuotas).
- Registro de pago: fecha, monto, porción capital/interés, saldo restante; crea gasto y ajusta cuenta.
- Notificación al saldar el préstamo.
- Tarjeta por préstamo con resumen y pagos.

### Falta por desarrollar
- Filtro por “solo personales” / “por cuenta compartida” en la página.
- Adjunto o comprobante por pago.
- Préstamos entre usuarios (presté/me prestaron) con estado de cobro.
- Recordatorios de próxima cuota (notificación o en dashboard).
- Vista “solo pendientes” o “vencidos”.

---

## 8. Suscripciones

### Implementado
- Listado de suscripciones (nombre, monto, frecuencia, próximo pago).
- Alta: nombre, monto, frecuencia mensual/anual, próxima fecha, descripción.
- Edición y eliminación.
- Marcar como pagado (actualiza próxima fecha).
- Total equivalente mensual.
- Vista tarjeta en pantallas pequeñas, tabla en escritorio.
- Modal de detalle.
- RLS para propias y compartidas.

### Falta por desarrollar
- Selector de mes o “próximos 30 días” para ver qué vence.
- Recordatorio antes del vencimiento (notificación).
- Vinculación opcional con un gasto (al marcar pagado, crear gasto automático).
- Filtro por cuenta compartida en la página.
- Campo “cuenta de cargo” (desde qué wallet se paga).

---

## 9. Impuestos

### Implementado
- Listado de obligaciones (nombre, monto, periodo, vencimiento, estado).
- Alta: nombre, monto, tipo de periodo (mensual/trimestral/anual), fecha vencimiento, notas.
- Edición y eliminación.
- Marcar como pagado (con fecha).
- Total pendiente por pagar.
- Vista tarjeta en pantallas pequeñas, tabla en escritorio.
- Modal de detalle.
- RLS para propias y compartidas.

### Falta por desarrollar
- Recordatorio antes del vencimiento (notificación).
- Filtro “solo pendientes” / “vencidos”.
- Vinculación con gasto al marcar pagado (crear gasto automático).
- Filtro por cuenta compartida en la página.
- Histórico de pagos por obligación (solo se guarda paid_at en la misma fila).

---

## 10. Cuentas compartidas

### Implementado
- Listado de grupos del usuario.
- Crear cuenta compartida (nombre; código de invitación de 6 caracteres).
- Unirse por código (RPC, máximo 5 miembros).
- Invitación por enlace (token, caducidad 7 días).
- Aceptar invitación desde `/invite?token=...`.
- Abandonar grupo.
- Eliminar cuenta compartida (owner).
- Ver miembros; eliminar miembro (owner); transferir propiedad (y actualizar `created_by`).
- Dashboard por grupo (`/shared/[id]`): balance, ingresos/gastos totales, ahorro grupal, metas de ahorro del grupo, lista de miembros.
- RLS y políticas para miembros/owners.
- Los ingresos/gastos/presupuestos/ahorros pueden asociarse a una cuenta compartida.

### Falta por desarrollar
- Listado de ingresos/gastos del grupo en la página del grupo (ahora solo totales y metas).
- Navegación rápida “ver gastos de este grupo” que lleve a Gastos filtrado por ese contexto.
- Límite de grupos por usuario (opcional).
- Roles más granulares (solo ver vs editar).
- Actividad reciente del grupo (últimos movimientos o cambios).
- Expulsar miembro con notificación por correo (opcional).

---

## 11. Categorías

### Implementado
- Listado de categorías (nombre, icono, color, tipo ingreso/gasto).
- Alta: nombre, icono, color, tipo.
- Edición y eliminación.
- Uso en ingresos, gastos y presupuestos.
- Categorías propias y por cuenta compartida (RLS).
- Vista en grid de tarjetas.

### Falta por desarrollar
- Filtro “solo personales” / “por cuenta compartida” en la página.
- Ordenación o “favoritas” para mostrar primero en formularios.
- Categorías predefinidas por defecto al registrar usuario (semilla).
- Subcategorías o categorías anidadas (opcional).
- Uso en reportes/gráficos por categoría ya existe en dashboard; no hay página “solo categorías con totales”.

---

## 12. Etiquetas

### Implementado
- Listado de etiquetas (nombre, color).
- Alta, edición y eliminación.
- Selector de etiquetas en formularios de ingreso y gasto.
- Persistencia de relación ingreso↔etiquetas y gasto↔etiquetas.
- Vista en grid de tarjetas.
- Uso en dashboard (distribución por etiqueta).

### Falta por desarrollar
- Filtro en listados de ingresos/gastos por etiqueta.
- Etiquetas por cuenta compartida (hoy son por usuario).
- Orden o “más usadas” en el selector.
- Eliminación de etiqueta con opción “quitar de todos los movimientos” o “dejar sin etiqueta”.

---

## 13. Notificaciones

### Implementado
- Listado de notificaciones (título, cuerpo, tipo, enlace, leída/no leída).
- Marcar como leída una o todas.
- Contador de no leídas en campana (header).
- Tipos: info, reminder, loan, shared, budget, alert.
- Creación desde backend (presupuesto, préstamo saldado, meta alcanzada, etc.).
- Preferencias: correo y push (activar/desactivar); en app siempre activas.
- Envío de correo de prueba (Resend).
- Suscripción a push (navegador).
- API/cron para envío (por ejemplo recordatorios).
- RLS por usuario.

### Falta por desarrollar
- Filtro por tipo de notificación o por “no leídas”.
- Eliminación de notificación individual o “borrar todas”.
- Preferencias granulares (qué tipos enviar por correo o push).
- Notificaciones in-app con “acción” (ej. “Ir al préstamo”, “Ver presupuesto”).
- Histórico o archivo de notificaciones antiguas (límite de 100 en get; paginación o “cargar más”).

---

## 14. Configuración

### Implementado
- Pestañas: Perfil, Categorías, Etiquetas, Dashboard, Notificaciones.
- Perfil: nombre, moneda, zona horaria; guardar.
- Dashboard: contexto por defecto (global/personal/cuenta), cuenta por defecto; secciones visibles (resumen, presupuesto, cuentas, metas, tendencia, gráficas, distribución, deudas, accesos rápidos); orden de secciones (arriba/abajo).
- Notificaciones: activar/desactivar correo y push; enviar correo de prueba; suscribirse a push en el dispositivo.
- Zona peligrosa: limpiar cuenta personal (confirmaciones + contraseña); borra solo datos personales, no compartidos.
- Categorías y etiquetas: mismo contenido que en sus páginas dedicadas (listas + formularios).
- Estética mejorada (cabecera, tarjetas, pestañas).

### Falta por desarrollar
- Cambio de contraseña desde Configuración (existe página `/update-password` pero no enlace claro en configuración).
- Eliminación de cuenta (borrar usuario y todos sus datos; hoy solo “limpiar datos personales”).
- Exportación de todos mis datos (GDPR-style).
- Tema claro/oscuro (si no está ya en layout global).
- Idioma o locale (fechas, moneda, textos).
- Configuración de recordatorios (días antes para préstamos, impuestos, suscripciones).

---

## 15. Autenticación y acceso

### Implementado
- Login (email/contraseña).
- Registro.
- Recuperar contraseña (forgot password).
- Actualizar contraseña (página dedicada).
- Callback OAuth (Supabase).
- Cierre de sesión.
- Middleware: proteger rutas de dashboard; redirigir no autenticados a login; redirigir autenticados desde login/register a dashboard.
- Cookie de usuario para failover (Appwrite) cuando Supabase no responde.
- Página de invitación pública (`/invite?token=...`) para aceptar invitación a cuenta compartida.

### Falta por desarrollar
- Login con proveedores (Google, GitHub, etc.) si se desea.
- Verificación de correo obligatoria antes de usar la app.
- 2FA (dos factores).
- Sesiones activas / “cerrar otras sesiones”.
- Límite de intentos de login o CAPTCHA en formularios públicos.

---

## 16. Reportes y exportación

### Implementado
- Exportar reporte mensual (CSV) desde el dashboard: ingresos y gastos del mes, ordenados por fecha (solo datos personales en la implementación actual de `exportMonthlyReport`).
- Filtro por wallet y contexto en dashboard (afecta datos mostrados; el export podría no respetar el filtro actual).

### Falta por desarrollar
- Export con filtro de contexto/cuenta aplicado (personal vs compartido, o por wallet).
- Export en PDF con o sin gráficos.
- Reporte por rango de fechas (varios meses o año).
- Reporte por categoría o etiqueta (totales, no solo lista de transacciones).
- Incluir en el export: suscripciones, préstamos, impuestos, ahorros (resumen o detalle).
- Programar envío por correo (reporte semanal/mensual automático).

---

## Resumen de prioridades sugeridas

| Prioridad | Apartado        | Funcionalidad principal que falta                          |
|----------|-----------------|------------------------------------------------------------|
| Alta     | Gastos          | MonthPicker en la página (navegar por mes)                 |
| Alta     | Presupuestos    | UI para presupuestos por cuenta compartida                |
| Media    | Ingresos/Gastos | Filtro por cuenta compartida / personales en la página    |
| Media    | Cuentas         | Historial de movimientos por cuenta                       |
| Media    | Reportes        | Export que respete filtro y/o PDF                          |
| Media    | Configuración   | Enlace a “Cambiar contraseña” y “Eliminar cuenta”          |
| Baja     | Varios          | Recordatorios antes de vencimientos (préstamos, impuestos, suscripciones) |
| Baja     | Ahorros         | Retiros / cierre de meta con reintegro                    |
| Baja     | Notificaciones  | Preferencias por tipo y “borrar” notificaciones           |
