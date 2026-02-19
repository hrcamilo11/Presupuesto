import { getMyDebts } from "@/app/actions/collections";
import { getFriends } from "@/app/actions/social";
import { getWallets } from "@/app/actions/wallets";
import { DeudasClient } from "./deudas-client";

export default async function DeudasPage() {
    const [{ data: debts }, { data: friends }, { data: wallets }] = await Promise.all([
        getMyDebts(),
        getFriends(),
        getWallets(),
    ]);

    return (
        <DeudasClient
            initialDebts={debts || []}
            friends={friends || []}
            wallets={wallets || []}
        />
    );
}
