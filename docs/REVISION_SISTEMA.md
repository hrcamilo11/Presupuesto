# Revisión del sistema – Presupuesto (budget-tracker)

Revisión profunda de lógica, seguridad y consistencia. Fecha: 2026-02-13.

---

## Correcciones aplicadas

### 1. Middleware: rutas no protegidas
- **Problema:** `/budgets` y `/notifications` no estaban en `isDashboardRoute`, por lo que un usuario no autenticado podía acceder y ver estados de error en lugar de ser redirigido al login.
- **Solución:** Se añadieron `pathname === "/budgets"` y `pathname === "/notifications"` en `lib/supabase/middleware.ts`.

### 2. Limpieza de cuenta personal: presupuestos compartidos
- **Problema:** `wipeMyPersonalData` borraba todos los presupuestos del usuario (`delete().eq("user_id", userId)`), incluidos los de cuentas compartidas.
- **Solución:** Solo se eliminan presupuestos personales: `.is("shared_account_id", null)`. Se añadió `revalidatePath("/budgets")`.

### 3. Tipo `Budget` en TypeScript
- **Problema:** La tabla `budgets` tiene `shared_account_id` (migración) pero el tipo en `lib/database.types.ts` no lo reflejaba.
- **Solución:** Se añadió `shared_account_id?: string | null` al interface `Budget`.

### 4. Edición de gastos e ingresos: `shared_account_id`
- **Problema:** En `updateExpense` y `updateIncome` no se incluía `shared_account_id` en el `.update()`. Si en el futuro el formulario enviara este campo (o null), se podría sobrescribir por error.
- **Solución:** Se obtiene el valor anterior y se mantiene de forma explícita: `shared_account_id: formData.shared_account_id ?? previous?.shared_account_id ?? null`.

### 5. Transferencia de propiedad en cuentas compartidas
- **Problema:** `transferOwnership` actualizaba solo los roles en `shared_account_members`. La función `is_shared_account_owner()` también usa `shared_accounts.created_by`, por lo que el antiguo creador seguía siendo considerado “owner” en la base de datos.
- **Solución:** Tras cambiar roles, se actualiza `shared_accounts.created_by` al nuevo owner: `.update({ created_by: newOwnerId })`.

---

## Áreas validadas (sin cambios necesarios)

- **Auth:** Login/register, callback, middleware con cookie de failover y redirecciones correctas.
- **Gastos:** Validación con schema, ajuste de balance con `adjust_wallet_balance`, notificaciones de presupuesto, RLS.
- **Ingresos:** Misma lógica de balance y validación.
- **Wallets:** Creación/actualización/eliminación, transferencias vía RPC `transfer_between_wallets` (mismo usuario, crédito/debito), failover Appwrite.
- **Préstamos:** Creación, pagos con gasto asociado y ajuste de wallet, notificación al saldar.
- **Ahorros:** `contribute_to_savings` RPC actualiza wallet y meta; contribuciones compartidas; planes recurrentes.
- **Presupuestos:** Upsert con `user_id` y `shared_account_id`, get por contexto personal o compartido.
- **Cuentas compartidas:** Creación, unión por código (RPC), invitaciones, abandonar cuenta; RLS y `user_shared_account_ids`/`is_shared_account_owner`.
- **Comentarios en gastos:** Inserción con `user_id`, RLS para ver/crear según gasto propio o compartido.
- **Notificaciones:** Preferencias, envío de prueba, push; creación desde gastos/préstamos/ahorros.
- **Perfil:** Actualización de datos básicos y de dashboard; validación con zod.

---

## Recomendaciones (opcionales)

1. **Eliminar miembro (owner):** En `removeMember` no se impide que el owner se elimine a sí mismo; podría dejar la cuenta sin owner. Opciones: no permitir en UI que el owner se quite a sí mismo, o exigir transferir la propiedad antes.
2. **Eliminar wallet:** `deleteWallet` no comprueba si hay gastos/ingresos/transferencias asociados; las FK de la base de datos pueden impedir el borrado o cascadear. Revisar si se quiere bloqueo en app (p. ej. “No puedes borrar una cuenta con movimientos”) o dejar el comportamiento actual.
3. **Consola en producción:** En `createSavingsGoal` hay varios `console.log`; conviene quitarlos o usar un logger condicionado por entorno.
4. **Índices en FKs:** El linter de Supabase sigue reportando FKs sin índice; puede mejorar rendimiento en tablas grandes añadir índices en esas columnas.

---

## Resumen

- **5 correcciones** aplicadas (middleware, wipe, tipo Budget, update expense/income, transferencia de propiedad).
- **Lógica crítica** de gastos, ingresos, wallets, ahorros, préstamos, presupuestos y cuentas compartidas revisada y consistente con el esquema y RLS.
- **Seguridad:** Rutas protegidas, RLS con `(select auth.uid())`, validación en servidor con zod y comprobación de usuario en acciones.
