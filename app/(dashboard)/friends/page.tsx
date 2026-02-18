import { getFriends, getPendingFriendRequests } from "@/app/actions/social";
import { FriendsClient } from "./friends-client";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
    const [{ data: friends }, { data: pendingRequests }] = await Promise.all([
        getFriends(),
        getPendingFriendRequests(),
    ]);

    return (
        <FriendsClient
            initialFriends={friends || []}
            initialPendingRequests={pendingRequests || []}
        />
    );
}
