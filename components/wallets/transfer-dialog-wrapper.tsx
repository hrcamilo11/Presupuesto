"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { Wallet } from "@/lib/database.types";
import { TransferDialog } from "./transfer-dialog";

export function TransferDialogWrapper({ wallets }: { wallets: Wallet[] }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Transferir</span>
            </Button>
            <TransferDialog wallets={wallets} open={open} onOpenChange={setOpen} />
        </>
    );
}
