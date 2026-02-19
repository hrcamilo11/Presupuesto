import { getMyCollections } from "@/app/actions/collections";
import { getFriends } from "@/app/actions/social";
import { getWallets } from "@/app/actions/wallets";
import { CobrosClient } from "./cobros-client";

export default async function CobrosPage() {
    const [{ data: collections }, { data: friends }, { data: wallets }] = await Promise.all([
        getMyCollections(),
        getFriends(),
        getWallets(),
    ]);

    return (
        <CobrosClient
            initialCollections={collections || []}
            friends={friends || []}
            wallets={wallets || []}
        />
    );
}
