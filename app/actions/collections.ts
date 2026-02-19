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

    // If creditorId is provided, current user is the debtor
    // If debtorId is provided, current user is the creditor
    const finalCreditorId = creditorId || (debtorId ? user.id : null);
    const finalDebtorId = debtorId || (creditorId ? user.id : null);

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

export async function addCollectionPayment(collectionId: string, amount: number, notes?: string) {
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
    if (collection.creditor_id !== user.id) return { error: "Solo el acreedor puede registrar pagos." };

    const totalPaid = (collection.payments || []).reduce((acc: number, p: { amount: number }) => acc + Number(p.amount), 0);
    const newTotal = totalPaid + amount;

    if (newTotal > collection.amount + 0.01) { // Tiny margin for float issues
        return { error: `El monto excede el saldo pendiente (${collection.amount - totalPaid}).` };
    }

    // Insert payment
    const { error: paymentError } = await supabase
        .from("collection_payments")
        .insert({
            collection_id: collectionId,
            amount,
            notes,
            date: new Date().toISOString()
        });

    if (paymentError) return { error: paymentError.message };

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

    // Notify debtor
    if (collection.debtor_id) {
        await supabase.rpc('insert_notification', {
            p_user_id: collection.debtor_id,
            p_title: isFullyPaid ? "Deuda pagada" : "Abono recibido",
            p_body: isFullyPaid
                ? `Tu deuda de ${collection.amount} ${collection.currency} ha sido saldada.`
                : `Se ha registrado un abono de ${amount} ${collection.currency} a tu deuda.`,
            p_type: "loan",
            p_link: "/deudas"
        });
    }

    revalidatePath("/cobros");
    revalidatePath("/deudas");
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

export async function markCollectionAsPaid(collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: results, error: fetchError } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId);

    const collection = results?.[0];

    if (fetchError || !collection) return { error: "Cobro no encontrado." };

    if (collection.creditor_id !== user.id) return { error: "Solo el acreedor puede marcar como pagado." };

    const { error } = await supabase
        .from("collections")
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq("id", collectionId);

    if (error) return { error: error.message };

    if (collection.debtor_id) {
        await supabase.rpc('insert_notification', {
            p_user_id: collection.debtor_id,
            p_title: "Deuda pagada",
            p_body: `El cobro de ${collection.amount} ${collection.currency} ha sido marcado como pagado.`,
            p_type: "loan",
            p_link: "/deudas"
        });
    }

    revalidatePath("/deudas");
    revalidatePath("/cobros");
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
