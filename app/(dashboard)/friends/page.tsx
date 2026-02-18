import { getFriends, getPendingFriendRequests, getSentFriendRequests } from "@/app/actions/social";
import { FriendsClient } from "./friends-client";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
    const [{ data: friends }, { data: pendingRequests }, { data: sentRequests }] = await Promise.all([
        getFriends(),
        getPendingFriendRequests(),
        getSentFriendRequests(),
    ]);

    return (
        <FriendsClient
            initialFriends={friends || []}
            initialPendingRequests={pendingRequests || []}
            initialSentRequests={sentRequests || []}
        />
    );
}
