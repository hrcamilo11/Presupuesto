import { getMyDebts } from "@/app/actions/collections";
import { DeudasClient } from "./deudas-client";

export default async function DeudasPage() {
    const { data: debts } = await getMyDebts();

    return (
        <DeudasClient
            initialDebts={debts || []}
        />
    );
}
