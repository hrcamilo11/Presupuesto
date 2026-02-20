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

export async function sendFriendRequest(friendId: string): Promise<{ error: string | null; message?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // 1. Check if there's already a record in either direction
    const { data: existingRecords, error: fetchError } = await supabase
        .from("friends")
        .select("*")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (fetchError) return { error: fetchError.message };

    // If multiple exist (unexpected), prioritize: accepted > pending > rejected
    const sorted = (existingRecords || []).sort((a, b) => {
        const order: Record<FriendStatus, number> = { accepted: 3, pending: 2, rejected: 1 };
        return order[b.status as FriendStatus] - order[a.status as FriendStatus];
    });
    const existing = sorted[0];

    if (existing) {
        // Simple cases: already friends or already pending from Me -> Friend
        if (existing.status === 'accepted') return { error: "Ya sois amigos." };
        if (existing.status === 'pending' && existing.user_id === user.id) {
            return { error: "Ya has enviado una solicitud a este usuario." };
        }

        // Case A: I sent a request before and it was rejected. Resend it.
        if (existing.status === 'rejected' && existing.user_id === user.id) {
            const { error: updateError } = await supabase
                .from("friends")
                .update({ status: 'pending', updated_at: new Date().toISOString() })
                .eq("id", existing.id);

            if (updateError) return { error: updateError.message };
        }

        // Case B: They sent me a request (pending or rejected). Accept it automatically.
        else if (existing.friend_id === user.id) {
            const { error: updateError } = await supabase
                .from("friends")
                .update({ status: 'accepted', updated_at: new Date().toISOString() })
                .eq("id", existing.id);

            if (updateError) return { error: updateError.message };

            // Notify them that I accepted
            const { data: profiles } = await supabase.from("profiles").select("full_name, username").eq("id", user.id);
            const myProfile = profiles?.[0];
            const accepterName = myProfile?.full_name || myProfile?.username || "Tu nuevo amigo";

            await supabase.rpc('insert_notification', {
                p_user_id: existing.user_id,
                p_title: "¡Nueva amistad!",
                p_body: `${accepterName} ha aceptado tu solicitud.`,
                p_type: "info",
                p_link: "/friends"
            });

            revalidatePath("/friends");
            return { error: null, message: "¡Ahora sois amigos!" };
        }
    } else {
        // 2. No existing record, insert a new one
        const { error: insertError } = await supabase
            .from("friends")
            .insert({
                user_id: user.id,
                friend_id: friendId,
                status: "pending"
            });

        if (insertError) {
            if (insertError.code === '23505') return { error: "Ya existe una solicitud o amistad con este usuario." };
            return { error: insertError.message };
        }
    }

    // Notify the friend (only for new requests or resent ones)
    const { data: profiles } = await supabase.from("profiles").select("full_name, username").eq("id", user.id);
    const myProfile = profiles?.[0];
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

    const { data: requests, error: fetchError } = await supabase
        .from("friends")
        .select("*")
        .eq("id", requestId);

    const request = requests?.[0];
    if (fetchError || !request) return { error: "Solicitud no encontrada." };
    if (request.friend_id !== user.id) return { error: "No autorizado." };

    const { error } = await supabase
        .from("friends")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", requestId);

    if (error) return { error: error.message };

    // Notify sender if accepted
    if (status === 'accepted') {
        const { data: profiles } = await supabase.from("profiles").select("full_name, username").eq("id", user.id);
        const myProfile = profiles?.[0];
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

    if (error) {
        console.error("Error en getFriends:", error);
        return { data: [], error: error.message };
    }

    // Map to a simpler format, handling potential array joins from Supabase
    const friends = (data || []).map(f => {
        const isSender = f.user_id === user.id;
        const rawProfile = isSender ? f.receiver : f.sender;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

        if (!profile) return null;

        return {
            friendship_id: f.id,
            profile: profile as Profile
        };
    }).filter(Boolean) as { friendship_id: string, profile: Profile }[];

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

    if (error) {
        console.error("Error en getPendingFriendRequests:", error);
        return { data: [], error: error.message };
    }

    console.log("Pending requests raw data:", JSON.stringify(data, null, 2));

    const mapped = (data || []).map(req => {
        const profile = Array.isArray(req.sender) ? req.sender[0] : req.sender;
        if (!profile) {
            console.warn("Sender profile not found for request:", req.id);
            return null;
        }
        return {
            ...req,
            sender: profile as Profile
        };
    }).filter(Boolean) as { id: string, user_id: string, created_at: string, sender: Profile }[];

    console.log("Mapped pending requests:", mapped.length);

    return { data: mapped, error: null };
}

export async function getSentFriendRequests() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("friends")
        .select(`
            id,
            friend_id,
            created_at,
            receiver:profiles!friends_friend_id_fkey(id, full_name, username)
        `)
        .eq("user_id", user.id)
        .eq("status", "pending");

    if (error) {
        console.error("Error en getSentFriendRequests:", error);
        return { data: [], error: error.message };
    }

    const mapped = (data || []).map(req => {
        const profile = Array.isArray(req.receiver) ? req.receiver[0] : req.receiver;
        if (!profile) return null;
        return {
            ...req,
            receiver: profile as Profile
        };
    }).filter(Boolean) as { id: string, friend_id: string, created_at: string, receiver: Profile }[];

    return { data: mapped, error: null };
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
