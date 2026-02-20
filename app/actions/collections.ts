"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCollection(
    debtorId: string | null,
    amount: number,
    currency: string = 'COP',
    description?: string,
    debtorName?: string,
    creditorId: string | null = null,
    creditorName?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // If creditorId/creditorName are provided, current user is the debtor
    // If debtorId/debtorName are provided, current user is the creditor
    const finalCreditorId = creditorId || (debtorId || debtorName ? user.id : null);
    const finalDebtorId = debtorId || (creditorId || creditorName ? user.id : null);

    const { data: inserts, error } = await supabase
        .from("collections")
        .insert({
            creditor_id: finalCreditorId,
            creditor_name: creditorName,
            debtor_id: finalDebtorId,
            debtor_name: debtorName,
            amount,
            currency,
            description,
            // Status is pending if it involves a friend who needs to approve
            status: (finalCreditorId && finalDebtorId) ? 'pending_approval' : 'active'
        })
        .select();

    const data = inserts?.[0];
    if (error || !data) return { error: error?.message || "Error al crear el registro." };

    // Notify the other party if it's a linked friend
    const otherPartyId = debtorId || creditorId;
    if (otherPartyId) {
        const { data: myProfile } = await supabase.from("profiles").select("full_name, username").eq("id", user.id).single();
        const myName = myProfile?.full_name || myProfile?.username || "Alguien";

        const title = debtorId ? "Nuevo cobro pendiente" : "Nueva deuda registrada";
        const body = debtorId
            ? `${myName} ha registrado un cobro de ${amount} ${currency}.`
            : `${myName} ha registrado que te debe ${amount} ${currency}. ¿Confirmas?`;
        const link = debtorId ? "/deudas" : "/cobros";

        await supabase.rpc('insert_notification', {
            p_user_id: otherPartyId,
            p_title: title,
            p_body: body,
            p_type: "loan",
            p_link: link,
            p_metadata: { collection_id: data.id }
        });
    }

    revalidatePath("/cobros");
    revalidatePath("/deudas");
    return { data, error: null };
}

export async function addCollectionPayment(collectionId: string, amount: number, notes?: string, walletId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Fetch collection to verify and check totals
    const { data: results, error: fetchError } = await supabase
        .from("collections")
        .select(`
            *,
            payments:collection_payments(amount)
        `)
        .eq("id", collectionId);

    const collection = results?.[0];

    if (fetchError || !collection) return { error: "Cobro no encontrado." };

    const isCreditor = collection.creditor_id === user.id;
    const isDebtor = collection.debtor_id === user.id;

    if (!isCreditor && !isDebtor) return { error: "No autorizado para registrar pagos en este cobro." };

    const totalPaid = (collection.payments || []).reduce((acc: number, p: { amount: number }) => acc + Number(p.amount), 0);
    const newTotal = totalPaid + amount;

    if (newTotal > collection.amount + 0.01) { // Tiny margin for float issues
        return { error: `El monto excede el saldo pendiente (${collection.amount - totalPaid}).` };
    }

    // Insert payment
    const { data: inserts, error: paymentError } = await supabase
        .from("collection_payments")
        .insert({
            collection_id: collectionId,
            amount,
            notes,
            date: new Date().toISOString()
        })
        .select();

    const payment = inserts?.[0];
    if (paymentError || !payment) return { error: paymentError?.message || "Error al registrar el abono" };

    // Create movement in wallet if provided
    if (walletId) {
        if (isCreditor) {
            // Create income
            const { data: income } = await supabase.from("incomes").insert({
                user_id: user.id,
                amount,
                currency: collection.currency,
                income_type: 'occasional',
                description: `Abono de: ${collection.debtor_name || 'Amigo'}${collection.description ? ` (${collection.description})` : ''}`,
                date: new Date().toISOString().slice(0, 10),
                wallet_id: walletId
            }).select().single();

            if (income) {
                await supabase.from("collection_payments").update({ creditor_income_id: income.id }).eq("id", payment.id);
            }
            await supabase.rpc("adjust_wallet_balance", { p_wallet_id: walletId, p_delta: amount });
        } else if (isDebtor) {
            // Create expense
            const { data: expense } = await supabase.from("expenses").insert({
                user_id: user.id,
                amount,
                currency: collection.currency,
                expense_priority: 'obligatory',
                description: `Pago a: ${collection.creditor_name || 'Amigo'}${collection.description ? ` (${collection.description})` : ''}`,
                date: new Date().toISOString().slice(0, 10),
                wallet_id: walletId
            }).select().single();

            if (expense) {
                await supabase.from("collection_payments").update({ debtor_expense_id: expense.id }).eq("id", payment.id);
            }
            await supabase.rpc("adjust_wallet_balance", { p_wallet_id: walletId, p_delta: -amount });
        }
    }

    // Update collection status
    const isFullyPaid = newTotal >= collection.amount - 0.01;
    const { error: updateError } = await supabase
        .from("collections")
        .update({
            status: isFullyPaid ? 'paid' : 'partially_paid',
            paid_at: isFullyPaid ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq("id", collectionId);

    if (updateError) return { error: updateError.message };

    // Notify other party
    const otherPartyId = isCreditor ? collection.debtor_id : collection.creditor_id;
    if (otherPartyId) {
        await supabase.rpc('insert_notification', {
            p_user_id: otherPartyId,
            p_title: isFullyPaid ? "Deuda pagada" : "Abono registrado",
            p_body: isFullyPaid
                ? `La deuda de ${collection.amount} ${collection.currency} ha sido saldada.`
                : `Se ha registrado un abono de ${amount} ${collection.currency} a la deuda.`,
            p_type: "loan",
            p_link: isCreditor ? `/deudas?paymentId=${payment.id}` : `/cobros?paymentId=${payment.id}`,
            p_metadata: { payment_id: payment.id, collection_id: collection.id }
        });
    }

    revalidatePath("/cobros");
    revalidatePath("/deudas");
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function respondToCollection(collectionId: string, accept: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: results, error: fetchError } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId);

    const collection = results?.[0];

    if (fetchError || !collection) return { error: "Registro no encontrado." };

    // Who is responding?
    const isDebtor = collection.debtor_id === user.id;
    const isCreditor = collection.creditor_id === user.id;

    if (!isDebtor && !isCreditor) return { error: "No autorizado." };

    const { error } = await supabase
        .from("collections")
        .update({
            status: accept ? 'active' : 'rejected',
            updated_at: new Date().toISOString()
        })
        .eq("id", collectionId);

    if (error) return { error: error.message };

    // Notify the other party
    const otherPartyId = isDebtor ? collection.creditor_id : collection.debtor_id;
    if (otherPartyId) {
        const { data: myProfile } = await supabase.from("profiles").select("full_name, username").eq("id", user.id).single();
        const myName = myProfile?.full_name || myProfile?.username || "Tu amigo";

        await supabase.rpc('insert_notification', {
            p_user_id: otherPartyId,
            p_title: accept ? "Solicitud aceptada" : "Solicitud rechazada",
            p_body: `${myName} ha ${accept ? 'aceptado' : 'rechazado'} la solicitud de ${collection.amount} ${collection.currency}.`,
            p_type: "loan",
            p_link: isDebtor ? "/cobros" : "/deudas"
        });
    }

    revalidatePath("/deudas");
    revalidatePath("/cobros");
    return { error: null };
}

export async function markCollectionAsPaid(collectionId: string, walletId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: results, error: fetchError } = await supabase
        .from("collections")
        .select(`
            *,
            payments:collection_payments(amount)
        `)
        .eq("id", collectionId);

    const collection = results?.[0];

    if (fetchError || !collection) return { error: "Cobro no encontrado." };

    if (collection.creditor_id !== user.id) return { error: "Solo el acreedor puede marcar como pagado." };

    // Calculate remaining balance to register as income if wallet provided
    const totalPaid = (collection.payments || []).reduce((acc: number, p: { amount: number }) => acc + Number(p.amount), 0);
    const balance = collection.amount - totalPaid;

    const { error } = await supabase
        .from("collections")
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq("id", collectionId);

    if (error) return { error: error.message };

    // Movement in wallet if provided and there is pending balance
    if (walletId && balance > 0) {
        await supabase.from("incomes").insert({
            user_id: user.id,
            amount: balance,
            currency: collection.currency,
            income_type: 'occasional',
            description: `Pago final de: ${collection.debtor_name || 'Amigo'}${collection.description ? ` (${collection.description})` : ''}`,
            date: new Date().toISOString().slice(0, 10),
            wallet_id: walletId
        });
        await supabase.rpc("adjust_wallet_balance", { p_wallet_id: walletId, p_delta: balance });
    }

    if (collection.debtor_id) {
        await supabase.rpc('insert_notification', {
            p_user_id: collection.debtor_id,
            p_title: "Deuda pagada",
            p_body: `El cobro de ${collection.amount} ${collection.currency} ha sido marcado como pagado.`,
            p_type: "loan",
            p_link: "/deudas"
        });
    }

    revalidatePath("/dashboard");
    return { error: null };
}

export async function allocateCollectionPayment(paymentId: string, walletId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Fetch the payment and the associated collection
    const { data: results, error: fetchError } = await supabase
        .from("collection_payments")
        .select(`
            *,
            collection:collections(*)
        `)
        .eq("id", paymentId);

    const payment = results?.[0];
    if (fetchError || !payment) return { error: "Pago no encontrado." };

    const collection = payment.collection;
    const isCreditor = collection.creditor_id === user.id;
    const isDebtor = collection.debtor_id === user.id;

    if (!isCreditor && !isDebtor) return { error: "No autorizado." };

    // Check if already allocated
    if (isCreditor && payment.creditor_income_id) return { error: "Este pago ya fue ubicado en una cuenta." };
    if (isDebtor && payment.debtor_expense_id) return { error: "Este pago ya fue descontado de una cuenta." };

    if (isCreditor) {
        // Create income
        const { data: income, error: incomeError } = await supabase.from("incomes").insert({
            user_id: user.id,
            amount: payment.amount,
            currency: collection.currency,
            income_type: 'occasional',
            description: `Abono de: ${collection.debtor_name || 'Amigo'}${collection.description ? ` (${collection.description})` : ''}`,
            date: new Date().toISOString().slice(0, 10),
            wallet_id: walletId
        }).select().single();

        if (incomeError) return { error: incomeError.message };

        await supabase.from("collection_payments").update({ creditor_income_id: income.id }).eq("id", paymentId);
        await supabase.rpc("adjust_wallet_balance", { p_wallet_id: walletId, p_delta: payment.amount });
    } else {
        // Create expense
        const { data: expense, error: expenseError } = await supabase.from("expenses").insert({
            user_id: user.id,
            amount: payment.amount,
            currency: collection.currency,
            expense_priority: 'obligatory',
            description: `Pago a: ${collection.creditor_name || 'Amigo'}${collection.description ? ` (${collection.description})` : ''}`,
            date: new Date().toISOString().slice(0, 10),
            wallet_id: walletId
        }).select().single();

        if (expenseError) return { error: expenseError.message };

        await supabase.from("collection_payments").update({ debtor_expense_id: expense.id }).eq("id", paymentId);
        await supabase.rpc("adjust_wallet_balance", { p_wallet_id: walletId, p_delta: -payment.amount });
    }

    revalidatePath("/cobros");
    revalidatePath("/deudas");
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function getMyCollections() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          debtor:profiles!collections_debtor_id_fkey(id, full_name, username),
          payments:collection_payments(*)
        `)
        .eq("creditor_id", user.id)
        .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };

    const mapped = (data || []).map(item => ({
        ...item,
        debtor: Array.isArray(item.debtor) ? item.debtor[0] : item.debtor
    }));

    return { data: mapped, error: null };
}

export async function getMyDebts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          creditor:profiles!collections_creditor_id_fkey(id, full_name, username),
          payments:collection_payments(*)
        `)
        .eq("debtor_id", user.id)
        .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };

    const mapped = (data || []).map(item => ({
        ...item,
        creditor: Array.isArray(item.creditor) ? item.creditor[0] : item.creditor
    }));

    return { data: mapped, error: null };
}
