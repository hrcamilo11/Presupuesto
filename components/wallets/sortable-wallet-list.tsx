"use client";

import { useState, useTransition } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableWalletCard } from "./sortable-wallet-card";
import { reorderWallets } from "@/app/actions/wallets";
import { useToast } from "@/components/ui/use-toast";
import type { Wallet as WalletType } from "@/lib/database.types";

interface SortableWalletListProps {
    initialWallets: WalletType[];
}

export function SortableWalletList({ initialWallets }: SortableWalletListProps) {
    const [wallets, setWallets] = useState(initialWallets);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Configuración del sensor con retardo de 3 segundos para activación (long press)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 3000, // 3000ms = 3 segundos
                tolerance: 5, // Margen de movimiento antes de cancelar (px)
            },
        })
    );

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = wallets.findIndex((w) => w.id === active.id);
            const newIndex = wallets.findIndex((w) => w.id === over.id);

            const newOrderedWallets = arrayMove(wallets, oldIndex, newIndex);
            setWallets(newOrderedWallets);

            // Persistir el nuevo orden
            startTransition(async () => {
                const result = await reorderWallets(newOrderedWallets.map(w => w.id));
                if (result.error) {
                    toast({
                        variant: "destructive",
                        title: "Error al reordenar",
                        description: result.error,
                    });
                    // Revertir si hay error
                    setWallets(wallets);
                }
            });
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <SortableContext items={wallets.map(w => w.id)} strategy={rectSortingStrategy}>
                <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-opacity ${isPending ? 'opacity-70' : ''}`}>
                    {wallets.map((wallet) => (
                        <SortableWalletCard
                            key={wallet.id}
                            id={wallet.id}
                            wallet={wallet}
                            wallets={initialWallets}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
