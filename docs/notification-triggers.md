# Triggers para notificaciones (Email y Web Push)

Lista de eventos que pueden disparar **notificación in-app** + opcionalmente **email** y **Web Push**, según las preferencias del usuario.

---

## Préstamos (Loans)

| Trigger | Descripción | Sugerencia |
|--------|-------------|------------|
| **Cuota próxima a vencer** | X días antes del siguiente pago (ej. 3 días) | Email + Push |
| **Cuota vencida** | El día que pasó la fecha de pago sin registrar pago | Email + Push |
| **Préstamo saldado** | Última cuota pagada, préstamo al 0% | Email + Push (opcional) |

---

## Suscripciones (Subscriptions)

| Trigger | Descripción | Sugerencia |
|--------|-------------|------------|
| **Renovación próxima** | X días antes de `next_due_date` (ej. 5 días) | Email + Push |
| **Renovación hoy** | El día del cobro | Push (o Email) |

---

## Impuestos (Taxes)

| Trigger | Descripción | Sugerencia |
|--------|-------------|------------|
| **Vencimiento próximo** | X días antes de `due_date` (ej. 7 días) | Email + Push |
| **Vencimiento hoy** | El día del vencimiento si no está pagado | Email + Push |
| **Impuesto pagado** | Confirmación al marcar como pagado | Solo in-app (opcional) |

---

## Cuentas compartidas (Shared accounts)

| Trigger | Descripción | Sugerencia |
|--------|-------------|------------|
| **Invitación recibida** | Alguien te invita a una cuenta compartida | Email + Push |
| **Nuevo miembro** | Alguien aceptó invitación y se unió (notificar al owner) | Email o Push |
| **Nueva transacción grupal** | Gasto/ingreso en la cuenta compartida (opcional, puede ser molesto) | Solo in-app o desactivable |

---

## Ahorros (Savings)

| Trigger | Descripción | Sugerencia |
|--------|-------------|------------|
| **Meta alcanzada** | `current_amount >= target_amount` | Email + Push |
| **Recordatorio de aporte** | Si tienes plan de ahorro y no has aportado este periodo | Push (opcional) |
| **Ahorro grupal: nuevo aporte** | Alguien aportó a la meta compartida | Solo in-app (opcional) |

---

## Presupuestos (Budgets)

| Trigger | Descripción | Sugerencia |
|--------|-------------|------------|
| **Presupuesto al 80%** | Gastos en la categoría >= 80% del presupuesto del periodo | Push (o Email) |
| **Presupuesto superado** | Gastos > presupuesto en la categoría | Email + Push |

---

## Cuentas / Wallets

| Trigger | Descripción | Sugerencia |
|--------|-------------|------------|
| **Saldo bajo** | Balance por debajo de un umbral (configurable por cuenta) | Push (opcional) |
| **Tarjeta de crédito cerca del límite** | Uso >= X% del cupo (ej. 90%) | Email + Push |
| **Saldo negativo (crédito)** | Pasaste el límite de la tarjeta | Email + Push |

---

## Recordatorios genéricos

| Trigger | Descripción | Sugerencia |
|--------|-------------|------------|
| **Recordatorio personal** | El usuario crea un recordatorio “avísame en fecha X” (feature futura) | Email + Push |
| **Resumen semanal/mensual** | Resumen de gastos, ahorros, préstamos (ej. cada lunes o día 1) | Email (digest) |

---

## Resumen por prioridad sugerida

**Alta (muy útiles):**
- Cuota de préstamo próxima / vencida
- Renovación de suscripción próxima
- Vencimiento de impuesto próximo / hoy
- Invitación a cuenta compartida
- Presupuesto superado
- Meta de ahorro alcanzada

**Media:**
- Préstamo saldado
- Nuevo miembro en cuenta compartida
- Presupuesto al 80%
- Tarjeta cerca del límite

**Baja / opcional:**
- Recordatorios de aporte a ahorro
- Saldo bajo en cuenta
- Resumen semanal/mensual (digest)
- Notificación por cada transacción en cuenta compartida

---

## Notas de implementación

- Todos los triggers deben crear primero la **notificación in-app** (`createNotification`) y, según preferencias del usuario, enviar **email** y **Web Push** (eso ya lo hace `createNotification` si las preferencias están activas).
- Los avisos por “X días antes” se suelen implementar con un **cron job** (Vercel Cron, Supabase Edge Function programada, o worker externo) que cada día consulta vencimientos y envía notificaciones.
- Para “inmediato” (ej. invitación, nuevo miembro) se llama a `createNotification` desde la server action correspondiente justo después del evento.
