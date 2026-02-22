
import { getPendingFriendRequests, searchUsers } from "@/app/actions/social";
import { createClient } from "@/lib/supabase/server";

export default async function DebugFriendsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const result = await getPendingFriendRequests();

    // 1. Search using the server action (RPC)
    const { data: searchResults, error: searchError } = await searchUsers("samrromz");

    // 2. Get ALL friend records and resolve profiles manually
    const { data: allFriendships } = await supabase
        .from("friends")
        .select("*")
        .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`);

    const enrichedFriendships = await Promise.all((allFriendships || []).map(async (f) => {
        const otherId = f.user_id === user?.id ? f.friend_id : f.user_id;
        const { data: profile } = await supabase.from("profiles").select("username, full_name").eq("id", otherId).single();
        return { ...f, other_profile: profile };
    }));

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Debug Friends</h1>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Current User</h2>
                <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(user, null, 2)}
                </pre>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Search &apos;samrromz&apos; (RPC)</h2>
                <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify({ searchResults, searchError }, null, 2)}
                </pre>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">All Friendship Records (Enriched)</h2>
                <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(enrichedFriendships, null, 2)}
                </pre>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">getPendingFriendRequests Result</h2>
                <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
        </div>
    );
}
