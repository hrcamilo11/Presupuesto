import { getMyDebts } from "@/app/actions/collections";
import { getFriends } from "@/app/actions/social";
import { DeudasClient } from "./deudas-client";

export default async function DeudasPage() {
    const [{ data: debts }, { data: friends }] = await Promise.all([
        getMyDebts(),
        getFriends(),
    ]);

    return (
        <DeudasClient
            initialDebts={debts || []}
            friends={friends || []}
        />
    );
}
