# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

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
- **Tipado**: Resueltos múltiples errores de tipos e inconsistencias en los formularios de cuentas.

---

## [1.0.0] - Versión Inicial
- Gestión básica de ingresos, gastos y presupuestos.
- Soporte para cuentas bancarias, efectivo y crédito.
- Dashboard interactivo con gráficos de distribución.
- Soporte para temas (claro/oscuro).
- Sincronización de respaldo con Appwrite.
