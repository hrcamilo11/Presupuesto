import { getMyCollections } from "@/app/actions/collections";
import { getFriends } from "@/app/actions/social";
import { CobrosClient } from "./cobros-client";

export default async function CobrosPage() {
    const [{ data: collections }, { data: friends }] = await Promise.all([
        getMyCollections(),
        getFriends(),
    ]);

    return (
        <CobrosClient
            initialCollections={collections || []}
            friends={friends || []}
        />
    );
}
