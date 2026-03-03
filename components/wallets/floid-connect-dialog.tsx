"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkFloidAccount } from "@/app/actions/floid-sync";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Link2, ExternalLink, ShieldCheck } from "lucide-react";

interface FloidConnectDialogProps {
  walletId: string;
  walletName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FloidConnectDialog({ 
  walletId, 
  walletName, 
  open, 
  onOpenChange 
}: FloidConnectDialogProps) {
  const [token, setToken] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  const handleLink = async () => {
    if (!token.trim()) return;
    setIsLinking(true);
    try {
      const res = await linkFloidAccount(walletId, token);
      if (res.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.error,
        });
      } else {
        toast({
          title: "¡Cuenta vinculada!",
          description: `Tu cuenta ${walletName} ahora está conectada con Floid.`,
        });
        onOpenChange(false);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "No se pudo vincular la cuenta.",
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-500" />
            Vincular con Floid
          </DialogTitle>
          <DialogDescription>
            Conecta tu Nequi de forma segura usando Floid para sincronizar tus movimientos automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Seguridad de Grado Bancario</p>
                <p>Floid utiliza encriptación de extremo a extremo. Tus credenciales nunca son almacenadas por nosotros.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="floid-token" className="text-sm">Access Token (Floid Connect)</Label>
            <div className="relative">
              <Input 
                id="floid-token"
                placeholder="Ingresa el token generado por Floid" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                type="password"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Normalmente este proceso es automático mediante el widget de Floid.
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => window.open('https://floid.io', '_blank')}
          >
            Abrir Widget de Floid
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleLink} disabled={isLinking || !token.trim()}>
            {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Vinculación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
