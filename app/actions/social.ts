"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { FriendStatus, Profile } from "@/lib/database.types";

export async function searchUsers(query: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    // Use the RPC for fuzzy search or the standard search
    const { data, error } = await supabase
        .rpc('search_profile_by_username', { search_text: query });

    if (error) return { data: [], error: error.message };

    // Filter out self
    const filtered = (data as Profile[]).filter(p => p.id !== user.id);
    return { data: filtered, error: null };
}

export async function sendFriendRequest(friendId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("friends")
        .insert({
            user_id: user.id,
            friend_id: friendId,
            status: "pending"
        });

    if (error) {
        if (error.code === '23505') return { error: "Ya existe una solicitud o amistad con este usuario." };
        return { error: error.message };
    }

    // Notify the friend
    const { data: myProfile } = await supabase.from("profiles").select("full_name, username").eq("id", user.id).single();
    const senderName = myProfile?.full_name || myProfile?.username || "Alguien";

    await supabase.rpc('insert_notification', {
        p_user_id: friendId,
        p_title: "Nueva solicitud de amistad",
        p_body: `${senderName} quiere añadirte como amigo.`,
        p_type: "info",
        p_link: "/friends"
    });

    revalidatePath("/friends");
    return { error: null };
}

export async function respondToFriendRequest(requestId: string, status: FriendStatus) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: request, error: fetchError } = await supabase
        .from("friends")
        .select("*")
        .eq("id", requestId)
        .single();

    if (fetchError || !request) return { error: "Solicitud no encontrada." };
    if (request.friend_id !== user.id) return { error: "No autorizado." };

    const { error } = await supabase
        .from("friends")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", requestId);

    if (error) return { error: error.message };

    // Notify sender if accepted
    if (status === 'accepted') {
        const { data: myProfile } = await supabase.from("profiles").select("full_name, username").eq("id", user.id).single();
        const accepterName = myProfile?.full_name || myProfile?.username || "Tu amigo";

        await supabase.rpc('insert_notification', {
            p_user_id: request.user_id,
            p_title: "Solicitud de amistad aceptada",
            p_body: `${accepterName} ha aceptado tu solicitud de amistad.`,
            p_type: "info",
            p_link: "/friends"
        });
    }

    revalidatePath("/friends");
    return { error: null };
}

export async function getFriends() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    // Get friends where I am either user_id or friend_id and status is accepted
    const { data, error } = await supabase
        .from("friends")
        .select(`
      id,
      user_id,
      friend_id,
      status,
      sender:profiles!friends_user_id_fkey(id, full_name, username),
      receiver:profiles!friends_friend_id_fkey(id, full_name, username)
    `)
        .eq("status", "accepted")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) return { data: [], error: error.message };

    // Map to a simpler format
    const friends = (data || []).map(f => {
        const isSender = f.user_id === user.id;
        const friendProfile = isSender ? (f.receiver as unknown as Profile) : (f.sender as unknown as Profile);
        return {
            friendship_id: f.id,
            profile: friendProfile
        };
    });

    return { data: friends, error: null };
}

export async function getPendingFriendRequests() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("friends")
        .select(`
      id,
      user_id,
      created_at,
      sender:profiles!friends_user_id_fkey(id, full_name, username)
    `)
        .eq("friend_id", user.id)
        .eq("status", "pending");

    if (error) return { data: [], error: error.message };
    return { data, error: null };
}

export async function removeFriend(friendshipId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) return { error: error.message };

    revalidatePath("/friends");
    return { error: null };
}
