"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { TransferForm } from "./transfer-form";
import type { Wallet } from "@/lib/database.types";

export function TransferFormWrapper({ wallets }: { wallets: Wallet[] }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Transferir
            </Button>
            <TransferForm open={open} onOpenChange={setOpen} wallets={wallets} />
        </>
    );
}
