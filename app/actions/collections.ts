"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Collection, CollectionStatus } from "@/lib/database.types";

export async function createCollection(debtorId: string, amount: number, currency: string = 'COP', description?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data, error } = await supabase
        .from("collections")
        .insert({
            creditor_id: user.id,
            debtor_id: debtorId,
            amount,
            currency,
            description,
            status: 'pending_approval'
        })
        .select()
        .single();

    if (error) return { error: error.message };

    // Notify the debtor
    const { data: myProfile } = await supabase.from("profiles").select("full_name, username").eq("id", user.id).single();
    const creditorName = myProfile?.full_name || myProfile?.username || "Alguien";

    await supabase.rpc('insert_notification', {
        p_user_id: debtorId,
        p_title: "Nuevo cobro pendiente",
        p_body: `${creditorName} ha registrado un cobro de ${amount} ${currency}.`,
        p_type: "loan",
        p_link: "/deudas",
        p_metadata: { collection_id: data.id }
    });

    revalidatePath("/cobros");
    return { data, error: null };
}

export async function respondToCollection(collectionId: string, accept: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const status: CollectionStatus = accept ? 'active' : 'rejected';

    const { data: collection, error: fetchError } = await supabase
        .from("collections")
        .select("*, creditor:profiles!collections_creditor_id_fkey(full_name, username)")
        .eq("id", collectionId)
        .single();

    if (fetchError || !collection) return { error: "Cobro no encontrado." };
    if (collection.debtor_id !== user.id) return { error: "No autorizado." };

    const { error } = await supabase
        .from("collections")
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq("id", collectionId);

    if (error) return { error: error.message };

    // Notify creditor
    const { data: myProfile } = await supabase.from("profiles").select("full_name, username").eq("id", user.id).single();
    const debtorName = myProfile?.full_name || myProfile?.username || "Tu amigo";

    await supabase.rpc('insert_notification', {
        p_user_id: collection.creditor_id,
        p_title: accept ? "Cobro aceptado" : "Cobro rechazado",
        p_body: `${debtorName} ha ${accept ? 'aceptado' : 'rechazado'} el cobro de ${collection.amount} ${collection.currency}.`,
        p_type: "loan",
        p_link: "/cobros"
    });

    revalidatePath("/deudas");
    revalidatePath("/cobros");
    return { error: null };
}

export async function markCollectionAsPaid(collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: collection, error: fetchError } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .single();

    if (fetchError || !collection) return { error: "Cobro no encontrado." };

    // Both parties might want to mark as paid? Usually the creditor confirms payment.
    // User said: "cuando el cobro en la cuenta de quien lo creo se haya marcado como pago, la deuda tambien."
    // So creditor marks as paid.
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

    // Notify debtor
    await supabase.rpc('insert_notification', {
        p_user_id: collection.debtor_id,
        p_title: "Deuda pagada",
        p_body: `El cobro de ${collection.amount} ${collection.currency} ha sido marcado como pagado.`,
        p_type: "loan",
        p_link: "/deudas"
    });

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
      debtor:profiles!collections_debtor_id_fkey(id, full_name, username)
    `)
        .eq("creditor_id", user.id)
        .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data, error: null };
}

export async function getMyDebts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("collections")
        .select(`
      *,
      creditor:profiles!collections_creditor_id_fkey(id, full_name, username)
    `)
        .eq("debtor_id", user.id)
        .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data, error: null };
}
