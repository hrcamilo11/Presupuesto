"use client";

import { useState, useEffect, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateMyUsername, getMyProfile } from "@/app/actions/profile";
import { useToast } from "@/components/ui/use-toast";

export function UsernamePromptModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        async function checkUsername() {
            const { data: profile } = await getMyProfile();
            if (profile && !profile.username) {
                setIsOpen(true);
            }
        }
        checkUsername();
    }, []);

    async function handleSave() {
        if (username.length < 3) {
            setError("El nombre de usuario debe tener al menos 3 caracteres.");
            return;
        }

        startTransition(async () => {
            const { error: updateError } = await updateMyUsername(username);
            if (updateError) {
                setError(updateError);
            } else {
                setIsOpen(false);
                toast({
                    title: "Usuario actualizado",
                    description: "Tu nombre de usuario se ha guardado correctamente.",
                });
            }
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>¡Bienvenido! Define tu usuario</DialogTitle>
                    <DialogDescription>
                        Para usar las funciones sociales (amigos, cobros, deudas), necesitas un nombre de usuario único.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="modal-username">Nombre de usuario</Label>
                        <Input
                            id="modal-username"
                            placeholder="ej: juan_perez"
                            value={username}
                            onChange={(e) => {
                                setError(null);
                                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                            }}
                            maxLength={30}
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <p className="text-[10px] text-muted-foreground">
                            Solo letras minúsculas, números y guiones bajos (_). Mínimo 3 caracteres.
                        </p>
                    </div>
                </div>
                <Button className="w-full" onClick={handleSave} disabled={isPending || username.length < 3}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Guardar nombre de usuario
                </Button>
            </DialogContent>
        </Dialog>
    );
}
