"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserMinus, ShieldAlert } from "lucide-react";
import { removeMember, transferOwnership } from "@/app/actions/shared-experience";
import { useRouter } from "next/navigation";

interface Member {
    user_id: string;
    role: string;
    profiles: { full_name: string | null };
}

interface MemberAdminDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sharedAccountId: string;
    members: Member[];
    currentUserId: string;
}

export function MemberAdminDialog({
    open,
    onOpenChange,
    sharedAccountId,
    members,
    currentUserId
}: MemberAdminDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    async function handleRemove(userId: string) {
        if (!confirm("¿Seguro que quieres eliminar a este miembro?")) return;
        setLoading(userId);
        const result = await removeMember(sharedAccountId, userId);
        setLoading(null);
        if (result.error) alert(result.error);
        else router.refresh();
    }

    async function handleTransfer(userId: string) {
        if (!confirm("¿Seguro que quieres transferir la propiedad? Dejarás de ser el dueño.")) return;
        setLoading(userId);
        const result = await transferOwnership(sharedAccountId, userId);
        setLoading(null);
        if (result.error) alert(result.error);
        else {
            onOpenChange(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Administrar Miembros</DialogTitle>
                </DialogHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((m) => (
                            <TableRow key={m.user_id}>
                                <TableCell className="font-medium">
                                    {m.profiles?.full_name || "Usuario"}
                                    {m.user_id === currentUserId && " (Tú)"}
                                </TableCell>
                                <TableCell className="capitalize">{m.role}</TableCell>
                                <TableCell className="text-right">
                                    {m.user_id !== currentUserId && (
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Transferir Propiedad"
                                                onClick={() => handleTransfer(m.user_id)}
                                                disabled={!!loading}
                                            >
                                                <ShieldAlert className="h-4 w-4 text-amber-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Eliminar Miembro"
                                                onClick={() => handleRemove(m.user_id)}
                                                disabled={!!loading}
                                            >
                                                <UserMinus className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}
