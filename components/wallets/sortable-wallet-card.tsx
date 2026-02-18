"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WalletCard } from "./wallet-card";
import type { Wallet as WalletType } from "@/lib/database.types";

interface SortableWalletCardProps {
    id: string;
    wallet: any;
    wallets?: WalletType[];
}

export function SortableWalletCard({ id, wallet, wallets }: SortableWalletCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        animateLayoutChanges: () => false, // Mejora el rendimiento durante el arrastre
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
        touchAction: "none", // Importante para dispositivos móviles
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full">
            <WalletCard wallet={wallet} wallets={wallets} />
        </div>
    );
}
