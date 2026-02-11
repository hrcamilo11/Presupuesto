import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotificationForUser } from "@/lib/notifications/dispatch";

const CRON_SECRET = process.env.CRON_SECRET;

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = request.nextUrl.searchParams.get("secret");
  if (!CRON_SECRET || (authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  try {
    let sent = 0;

    // --- Préstamos: cuota próxima (3 días) o vencida ---
    const { data: loans } = await admin.from("loans").select("id, user_id, name, start_date, term_months");
    if (loans?.length) {
      for (const loan of loans) {
        const { data: lastPay } = await admin
          .from("loan_payments")
          .select("payment_number")
          .eq("loan_id", loan.id)
          .order("payment_number", { ascending: false })
          .limit(1)
          .single();
        const nextNum = (lastPay?.payment_number ?? 0) + 1;
        const termMonths = Number(loan.term_months ?? 12);
        if (nextNum > termMonths) continue;
        const nextDue = addMonths(loan.start_date, nextNum - 1);
        const days = daysBetween(nextDue, today);
        if (days < 0) {
          await createNotificationForUser({
            userId: loan.user_id,
            title: "Cuota de préstamo vencida",
            body: `La cuota del préstamo "${loan.name}" está vencida.`,
            type: "loan",
            link: "/loans",
          });
          sent++;
        } else if (days >= 0 && days <= 3) {
          await createNotificationForUser({
            userId: loan.user_id,
            title: "Cuota de préstamo próxima",
            body: `La próxima cuota del préstamo "${loan.name}" vence el ${nextDue}.`,
            type: "reminder",
            link: "/loans",
          });
          sent++;
        }
      }
    }

    // --- Suscripciones: renovación en 5 días o hoy ---
    const { data: subs } = await admin
      .from("subscriptions")
      .select("id, user_id, name, next_due_date");
    if (subs?.length) {
      for (const sub of subs) {
        const due = sub.next_due_date?.slice(0, 10);
        if (!due) continue;
        const days = daysBetween(due, today);
        if (days === 0) {
          await createNotificationForUser({
            userId: sub.user_id,
            title: "Renovación de suscripción hoy",
            body: `"${sub.name}" se renueva hoy.`,
            type: "reminder",
            link: "/subscriptions",
          });
          sent++;
        } else if (days > 0 && days <= 5) {
          await createNotificationForUser({
            userId: sub.user_id,
            title: "Renovación de suscripción próxima",
            body: `"${sub.name}" se renueva el ${due}.`,
            type: "reminder",
            link: "/subscriptions",
          });
          sent++;
        }
      }
    }

    // --- Impuestos: vencimiento en 7 días o hoy (no pagados) ---
    const { data: taxes } = await admin
      .from("tax_obligations")
      .select("id, user_id, name, due_date")
      .is("paid_at", null);
    if (taxes?.length) {
      for (const tax of taxes) {
        const due = tax.due_date?.slice(0, 10);
        if (!due) continue;
        const days = daysBetween(due, today);
        if (days < 0) {
          await createNotificationForUser({
            userId: tax.user_id,
            title: "Impuesto vencido",
            body: `"${tax.name}" venció el ${due}.`,
            type: "alert",
            link: "/taxes",
          });
          sent++;
        } else if (days >= 0 && days <= 7) {
          await createNotificationForUser({
            userId: tax.user_id,
            title: "Vencimiento de impuesto próximo",
            body: `"${tax.name}" vence el ${due}.`,
            type: "reminder",
            link: "/taxes",
          });
          sent++;
        }
      }
    }

    return NextResponse.json({ ok: true, notificationsSent: sent });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
