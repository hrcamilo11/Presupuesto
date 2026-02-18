# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.4.0] - 2026-02-18
### Añadido
- **Username en Registro**: Añadido campo de nombre de usuario obligatorio al proceso de registro.
- **Prompt de Username**: Implementada ventana modal obligatoria para usuarios existentes sin nombre de usuario.
- **Gestión de Amigos Robusta**: 
    - Pestañas separadas para solicitudes "Recibidas" y "Enviadas".
    - Auto-aceptación de solicitudes si ambos usuarios intentan agregarse mutuamente.
    - Los registros previos (rechazados) ahora pueden ser reactivados al enviar una nueva solicitud.
- **Persistencia de Filtros**: El selector de contexto del Dashboard (Global/Personal) ahora persiste correctamente en la URL.

### Corregido
- **Bug de Amigos**: Solucionado el problema de solicitudes "invisibles" que bloqueaban nuevas conexiones.
- **Escaner QR**: Migración a una librería más estable (`qr-scanner`) con mejor soporte de hardware.
- **Estabilidad de Build**: Eliminados errores de linting (`no-explicit-any`) que bloqueaban el despliegue en Vercel.

## [1.3.0] - 2026-02-18
### Added
- **Pagos Parciales**: Posibilidad de registrar abonos a los cobros, con historial detallado y cálculo de saldo pendiente.
- **Iniciación de Deudas**: Ahora puedes registrar una deuda propia y notificar al acreedor (amigo) para su aprobación.
- **Deudas Manuales**: Registro de deudas con personas externas (sin cuenta) para seguimiento personal.
- **Interfaz Mejorada**: Nuevas tarjetas informativas en Cobros y Deudas con estados claros y balances.

## [1.2.0] - 2026-02-18

### Añadido
- **Módulo de Cobros Flexibles**: Ahora permite registrar deudas de personas que no usan la aplicación (con nombre manual).
- **Menú Categorizado**: Rediseño de la barra lateral agrupando módulos en Finanzas, Planificación y Cuenta para una mejor navegación.
- **Flujo de QR Automatizado**: El escáner ahora solicita acceso directo a la cámara trasera y envía la solicitud de amistad automáticamente al escanear un perfil válido.

### Corregido
- **Build de Producción**: Resueltos errores críticos de tipado y linting detectados durante el despliegue en Vercel, asegurando compatibilidad con el modo estricto de TypeScript.

## [1.1.0] - 2026-02-17

### Añadido
- **Módulo de Inversiones**: Nueva vista dedicada para gestionar inversiones (`/investments`).
- **Detalles de Inversión**: Soporte para campos de rendimiento (%), plazo y fecha de inicio en cuentas de inversión.
- **Dashboard de Inversión**: Nuevas tarjetas que muestran el "Total Invertido" y "Rendimiento Estimado Mensual".
- **Saldos en Selectores**: Los selectores de cuenta en los formularios ahora muestran el saldo actual.
- **Iconografía**: Uso de `LineChart` para distinguir inversiones en la barra lateral.

### Cambiado
- **Refactor de Cuentas**: Se eliminó el tipo de cuenta "Ahorros" para simplificar la gestión financiera.
- **Restricción de Creación**: Ahora el sistema solo permite crear cuentas coherentes con la sección actual (ej: solo inversiones en la vista de Inversiones).
- **Separación de Vistas**: Las cuentas de inversión ahora están filtradas de la vista de "Cuentas" principal.
- **Restricción de Pagos**: Las cuentas de inversión ya no pueden seleccionarse para pagar gastos directamente.

### Corregido
- **Base de Datos**: Corregido el error de columna faltante `last_four_digits` en la tabla de cuentas.
- **Sincronización**: Actualizada la capa de respaldo de Appwrite para soportar los nuevos campos de inversión.
- **Tipado**: Resueltos múltiples errores de tipos e inconsistencias en los formularios de cuentas, incluyendo errores detectados durante el build en Vercel.
- **Estabilidad**: Corregida la lista de rutas protegidas en el middleware y eliminados espacios accidentales en variables de entorno que podrían causar errores de red (ERR_ADDRESS_UNREACHABLE).

---

## [1.0.0] - Versión Inicial
- Gestión básica de ingresos, gastos y presupuestos.
- Soporte para cuentas bancarias, efectivo y crédito.
- Dashboard interactivo con gráficos de distribución.
- Soporte para temas (claro/oscuro).
- Sincronización de respaldo con Appwrite.
