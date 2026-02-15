# Lista completa de flujos de la aplicación

Referencia para revisión de lógica. Cada flujo describe pasos del usuario y datos/acciones implicadas.

---

## 1. Autenticación

| Flujo | Ruta / Origen | Pasos | Acciones servidor |
|-------|----------------|-------|-------------------|
| **Login** | `/login` | 1) Email + contraseña → 2) Supabase signIn → 3) Redirect dashboard o `?redirect=` | `supabase.auth.signInWithPassword` |
| **Registro** | `/register` | 1) Email, contraseña, nombre → 2) signUp → 3) Redirect dashboard | `supabase.auth.signUp` |
| **Recuperar contraseña** | `/forgot-password` | 1) Email → 2) Envío enlace reset → 3) Usuario abre enlace → callback → `/update-password` | `supabase.auth.resetPasswordForEmail` |
| **Actualizar contraseña** | `/update-password` | 1) Nueva contraseña + confirmación → 2) updateUser({ password }) | `supabase.auth.updateUser` |
| **Cerrar sesión** | Header / menú | 1) Clic cerrar sesión → 2) signOut + redirect login | `supabase.auth.signOut` |
| **Middleware** | Todas las rutas | Protege dashboard; redirige no autenticados a login; redirige autenticados desde login/register a dashboard; `/` con auth → dashboard | `updateSession`: isDashboardRoute, isAuthRoute, redirects |

---

## 2. Dashboard

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Carga inicial** | 1) Leer perfil (default context/wallet) → 2) Si no hay params y hay default, redirect con params → 3) Cargar ingresos/gastos/suscripciones/impuestos/wallets/ahorros/presupuestos/categorías/trend/loans | `getBudgets`, queries por contexto y wallet, `processRecurringSavings`, `createDueReminders` |
| **Filtro contexto** | 1) Usuario elige Global / Personal / Cuenta X → 2) URL `?context=` → 3) Recarga con datos filtrados | Mismas queries con `.is("shared_account_id", null)` o `.eq("shared_account_id", id)` |
| **Filtro wallet** | 1) Usuario elige cuenta → 2) URL `?wallet=` → 3) Queries con `.eq("wallet_id", id)` | Ingresos, gastos, trend filtrados por wallet |
| **Exportar CSV** | 1) Clic "Exportar CSV" → 2) exportMonthlyReport(year, month, { context, wallet }) → 3) Descarga | `exportMonthlyReport` con filtros contexto y wallet |

---

## 3. Ingresos

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) Página con year/month (URL) y context (URL) → 2) Query ingresos en rango + filtro context | Query con `.gte/.lte date`, opcional `.is/.eq shared_account_id` |
| **Crear** | 1) Form: monto, tipo, fecha, categoría, cuenta, descripción, contexto compartido → 2) createIncome → 3) Ajuste saldo wallet (+amount) | `createIncome`, `adjustWalletBalance(supabase, wallet_id, +amount)` |
| **Editar** | 1) Form con datos actuales → 2) updateIncome(id, data) → 3) Revertir saldo anterior, aplicar nuevo | Leer previous (amount, wallet_id, shared_account_id); update; adjustWallet(previous, -prev); adjustWallet(new, +new) |
| **Eliminar** | 1) Confirmar → 2) deleteIncome(id) → 3) Restar monto del wallet | Leer income; delete; adjustWallet(wallet_id, -amount) |

---

## 4. Gastos

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) Página con year/month y context → 2) Query gastos en rango + filtro context | Igual que ingresos (filtro por fecha y shared_account_id) |
| **Crear** | 1) Form: monto, prioridad, fecha, categoría, cuenta, descripción, contexto → 2) createExpense → 3) Ajuste saldo wallet (-amount); notificación presupuesto si aplica | `createExpense`, `adjustWalletBalance(..., -amount)`, chequeo presupuesto (personales) |
| **Editar** | 1) Form → 2) updateExpense → 3) Revertir saldo viejo (+old), aplicar nuevo (-new); preservar shared_account_id | Igual patrón que ingresos |
| **Eliminar** | 1) Confirmar → 2) deleteExpense → 3) Devolver monto al wallet | adjustWallet(+, amount) |
| **Comentarios** | 1) Ver comentarios de un gasto → 2) Añadir comentario → createExpenseComment | `getExpenseComments`, `createExpenseComment` |

---

## 5. Presupuestos

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) Página con context (personal / cuenta compartida) → 2) getBudgets(sharedAccountId) | `getBudgets(undefined)` personales; `getBudgets(uuid)` por grupo |
| **Crear** | 1) Form: categoría, monto límite, periodo → 2) upsertBudget con shared_account_id según contexto | `upsertBudget` |
| **Editar** | 1) Form con datos del presupuesto → 2) upsertBudget con id y shared_account_id | Idem |
| **Eliminar** | 1) Confirmar → 2) deleteBudget(id) | `deleteBudget` |

---

## 6. Cuentas (Wallets)

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) getWallets() | `getWallets` (incluye ensureDefaultWallet si vacío) |
| **Crear** | 1) Form: tipo, nombre, moneda, saldo, etc. → 2) createWallet | `createWallet` |
| **Editar** | 1) Form → 2) updateWallet(id, data) | `updateWallet` |
| **Eliminar** | 1) Confirmar → 2) deleteWallet(id) | `deleteWallet` |
| **Transferencia** | 1) Origen, destino, monto, descripción → 2) transferBetweenWallets (RPC atómica) | RPC `transfer_between_wallets` |
| **Pagar tarjeta** | 1) Cuenta origen, monto → 2) transferBetweenWallets (origen → tarjeta crédito) | Mismo RPC |
| **Historial por cuenta** | 1) Clic "Ver historial" en tarjeta → 2) /wallets/[id]/history → 3) getWalletMovementHistory(id) | Ingresos + gastos + transferencias donde wallet participa; ordenados por fecha |

---

## 7. Ahorros (metas personales)

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) getSavingsGoals(), getWallets() | `getSavingsGoals` |
| **Crear meta** | 1) Form: nombre, tipo, monto objetivo, fecha, plan recurrente opcional → 2) createSavingsGoal | `createSavingsGoal` |
| **Contribuir** | 1) Monto, cuenta origen, fecha → 2) contributeToSavings (RPC) → 3) Wallet -= amount, goal += amount; notificación si alcanza meta | RPC `contribute_to_savings` |
| **Retirar** | 1) Monto, cuenta destino, fecha → 2) withdrawFromSavings (RPC) → 3) Goal -= amount, wallet += amount; insert savings_transactions type withdrawal | RPC `withdraw_from_savings` |
| **Eliminar meta** | 1) Confirmar → 2) deleteSavingsGoal(id) | `deleteSavingsGoal` |
| **Planes recurrentes** | 1) Al cargar dashboard → processRecurringSavings() | Ejecuta planes activos según frecuencia y day_of_period |

---

## 8. Ahorros (metas grupales)

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | getSharedSavingsGoals(), getMySharedAccounts() | Por grupo |
| **Crear** | 1) shared_account_id, nombre, target_amount, deadline → 2) createSharedSavingsGoal | `createSharedSavingsGoal` |
| **Contribuir** | 1) Monto, wallet, fecha → 2) contributeToSharedSavings (RPC) | RPC `contribute_to_shared_savings` |

---

## 9. Préstamos

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) Página con context → 2) Query loans con filtro shared_account_id | personal / global / uuid |
| **Crear** | 1) Form: nombre, principal, tasa, plazo, fecha inicio, etc. → 2) createLoan | `createLoan` |
| **Editar** | updateLoan(id, data) | `updateLoan` |
| **Eliminar** | deleteLoan(id) | `deleteLoan` |
| **Registrar pago** | 1) Fecha, monto, capital/interés, saldo restante → 2) recordLoanPayment → 3) Crea gasto y ajusta wallet | `recordLoanPayment` (expense + adjust wallet) |

---

## 10. Suscripciones

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) Página con filter (all / next30 / overdue) → 2) Query con next_due_date según filtro | `.lte/.gte` next_due_date |
| **Crear** | createSubscription | `createSubscription` |
| **Editar** | updateSubscription | `updateSubscription` |
| **Eliminar** | deleteSubscription | `deleteSubscription` |
| **Marcar pagado** | 1) markSubscriptionPaid(id) → 2) Actualiza next_due_date según frecuencia | `markSubscriptionPaid` |

---

## 11. Impuestos

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) Página con filter (all / pending / overdue) → 2) Query paid_at y due_date | `.is("paid_at", null)`, opcional `.lt("due_date", today)` |
| **Crear** | createTaxObligation | `createTaxObligation` |
| **Editar** | updateTaxObligation | `updateTaxObligation` |
| **Eliminar** | deleteTaxObligation | `deleteTaxObligation` |
| **Marcar pagado** | markTaxPaid(id, paidAt) | `markTaxPaid` |

---

## 12. Cuentas compartidas

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | getMySharedAccounts() | `getMySharedAccounts` |
| **Crear** | 1) Nombre → 2) createSharedAccount → Código 6 caracteres | `createSharedAccount` |
| **Unirse por código** | 1) Código 6 caracteres → 2) joinSharedAccount(code) | `joinSharedAccount` (RPC) |
| **Invitación por enlace** | 1) createInvite(sharedAccountId) → 2) Enlace con token → 3) Usuario abre /invite?token= → 4) acceptInvite(token) | `createInvite`, `acceptInvite` |
| **Abandonar** | leaveSharedAccount(id) | `leaveSharedAccount` |
| **Eliminar (owner)** | deleteSharedAccount(id) | `deleteSharedAccount` |
| **Miembros** | getSharedAccountMembers(id) | Lista miembros |
| **Expulsar** | removeMember(sharedAccountId, userId) | `removeMember` |
| **Transferir propiedad** | transferOwnership(sharedAccountId, newOwnerId) → actualiza created_by | `transferOwnership` |
| **Dashboard grupo** | /shared/[id] → getSharedAccountStats, ingresos/gastos/ahorro grupo | Queries por shared_account_id |

---

## 13. Categorías y etiquetas

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Categorías** | Listar, crear, editar, eliminar | getCategories(type?), createCategory, updateCategory, deleteCategory |
| **Etiquetas** | Listar, crear, editar, eliminar; asignar a ingreso/gasto | getTags, createTag, updateTag, deleteTag, setTransactionTags |

---

## 14. Notificaciones

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Listar** | 1) Página con filter (all / unread) → 2) getNotifications({ unreadOnly }) | `getNotifications` |
| **Marcar leída** | markAsRead(id) | `markAsRead` |
| **Marcar todas** | markAllAsRead() | `markAllAsRead` |
| **Eliminar** | deleteNotification(id) | `deleteNotification` |
| **Recordatorios** | Al cargar dashboard: createDueReminders() (suscripciones, impuestos, préstamos próximos 7 días) | `createDueReminders` (dedupe 24h por key) |

---

## 15. Configuración

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Perfil** | Nombre, moneda, zona horaria → updateMyProfileBasics | `updateMyProfileBasics` |
| **Dashboard** | Contexto/cuenta por defecto, secciones visibles, orden → updateMyDashboardSettings | `updateMyDashboardSettings` |
| **Notificaciones** | Email/push on/off, correo prueba, push subscribe → updateNotificationPreferences, sendTestEmail, savePushSubscription | Varias |
| **Categorías/Etiquetas** | Misma UI que páginas dedicadas | Idem acciones categorías/etiquetas |
| **Seguridad** | Enlace "Cambiar contraseña" → /update-password; "Ir a eliminar/limpiar" → #zona-peligrosa | Solo enlaces |
| **Limpiar cuenta** | 3 checks + contraseña → wipeMyPersonalData → Borra solo datos personales (shared_account_id null), revalida /budgets | `wipeMyPersonalData` |

---

## 16. Reportes

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Export CSV** | Dashboard: clic Exportar → exportMonthlyReport(year, month, { context, wallet }) → descarga | Filtra ingresos/gastos por context y wallet; genera CSV |

---

## 17. Invitación pública

| Flujo | Pasos | Acciones servidor |
|-------|--------|-------------------|
| **Sin token** | /invite → Mensaje "Enlace inválido" | - |
| **Sin sesión** | /invite?token= → redirect /login?redirect=/invite?token= | - |
| **Con sesión** | AcceptInviteForm(token) → acceptInvite(token) | `acceptInvite` |

---

## Rutas protegidas (middleware)

- Dashboard, ingresos, gastos, presupuestos, cuentas (incluye `/wallets/*`, p. ej. historial), ahorros, préstamos, suscripciones, impuestos, notificaciones, configuración, shared, update-password, `/`.
- Públicas: /login, /register, /forgot-password, /auth/callback. /invite accesible sin auth; la página redirige a login si no hay user.

---

## Revisión de lógica (validaciones realizadas)

| Área | Comportamiento revisado | Corrección aplicada |
|------|--------------------------|---------------------|
| **Middleware** | Solo se protegía la ruta exacta `/wallets`; `/wallets/[id]/history` quedaba accesible sin login. | Se cambió a `pathname.startsWith("/wallets")` para proteger todas las rutas bajo cuentas. |
| **Préstamos – registrar pago** | El gasto del pago se insertaba siempre con `shared_account_id: null`. | Se obtiene `shared_account_id` del préstamo y se asigna al gasto para que los pagos de préstamos compartidos aparezcan en el contexto del grupo. |
| **Gastos – notificación presupuesto** | Se consultaban todos los presupuestos del usuario (personales y por grupo) y se comparaban con gastos solo personales. | Se filtra presupuestos con `.is("shared_account_id", null)` para notificar solo por presupuestos personales vs gastos personales del mes. |
| **Ingresos/Gastos – editar** | Al editar, se preserva `shared_account_id` leyendo el valor anterior si no viene en el form. | Ya estaba correcto (uso de `previous?.shared_account_id`). |
| **Limpieza de cuenta** | Solo se borran datos personales (`shared_account_id` null) y se revalida `/budgets`. | Ya estaba correcto. |
| **Export report** | Respeta `context` y `wallet`; RLS restringe datos por usuario. | Correcto. |
| **Historial por cuenta** | Se comprueba que la wallet pertenezca al usuario antes de devolver movimientos. | Correcto. |
| **Suscripciones/Impuestos – filtros** | next30: `next_due_date` entre hoy y hoy+30; overdue: `next_due_date < hoy`; impuestos pending/overdue. | Correcto. |
| **Recordatorios** | createDueReminders con dedupe por `metadata.key` en 24 h. | Correcto. |
