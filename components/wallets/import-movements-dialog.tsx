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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  parseNequiText, 
  importNequiMovements, 
  type ParsedMovement 
} from "@/app/actions/nequi-import";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ClipboardPaste, FileUp, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ImportMovementsDialogProps {
  walletId: string;
  walletName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportMovementsDialog({ 
  walletId, 
  walletName, 
  open, 
  onOpenChange 
}: ImportMovementsDialogProps) {
  const [text, setText] = useState("");
  const [movements, setMovements] = useState<ParsedMovement[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleParse = async () => {
    if (!text.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseNequiText(text);
      if (parsed.length === 0) {
        toast({
          variant: "destructive",
          title: "No se encontraron movimientos",
          description: "Prueba copiando y pegando el texto completo de tus movimientos de Nequi.",
        });
      }
      setMovements(parsed);
    } catch {
      toast({
        variant: "destructive",
        title: "Error al procesar",
        description: "No se pudo interpretar el texto ingresado.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (movements.length === 0) return;
    setIsImporting(true);
    try {
      const res = await importNequiMovements(walletId, movements);
      if (res.error) {
        toast({
          variant: "destructive",
          title: "Error al importar",
          description: res.error,
        });
      } else {
        toast({
          title: "Importación exitosa",
          description: `Se agregaron ${res.addedCount} movimientos a ${walletName}.`,
        });
        onOpenChange(false);
        router.refresh();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ocurrió un error al guardar los movimientos.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setText(content);
      // Automatically parse after upload
      setIsParsing(true);
      const parsed = await parseNequiText(content);
      setMovements(parsed);
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Movimientos - {walletName}</DialogTitle>
          <DialogDescription>
            Carga tus movimientos de Nequi copiando el texto o subiendo un archivo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {movements.length === 0 ? (
            <Tabs defaultValue="paste" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Pegar Texto
                </TabsTrigger>
                <TabsTrigger value="file">
                  <FileUp className="h-4 w-4 mr-2" />
                  Subir Archivo
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="paste" className="flex-1 flex flex-col gap-2 mt-4">
                <div className="bg-muted p-2 rounded text-[10px] text-muted-foreground">
                  💡 <strong>Tip:</strong> Entra a la App de Nequi {">"} Movimientos, selecciona el periodo y copia todo el contenido. O copia el texto de tu extracto PDF.
                </div>
                <Textarea 
                  placeholder="Pega aquí el texto de tus movimientos..." 
                  className="flex-1 font-mono text-xs min-h-[200px]"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button onClick={handleParse} disabled={isParsing || !text.trim()}>
                  {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Analizar Texto
                </Button>
              </TabsContent>

              <TabsContent value="file" className="mt-4">
                <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 text-center">
                  <FileUp className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sube tu archivo CSV o TXT</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Si Nequi te permite descargar un archivo de texto, súbelo aquí.
                    </p>
                  </div>
                  <input 
                    type="file" 
                    id="nequi-file" 
                    className="hidden" 
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="nequi-file" className="cursor-pointer">
                      Seleccionar Archivo
                    </label>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Movimientos encontrados ({movements.length})
                </h4>
                <Button variant="ghost" size="sm" onClick={() => { setMovements([]); setText(""); }}>
                  Limpiar y reintentar
                </Button>
              </div>

              <div className="border rounded-md overflow-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((move, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{move.date}</TableCell>
                        <TableCell className="text-xs truncate max-w-[200px]">{move.description}</TableCell>
                        <TableCell className={`text-right font-medium text-xs ${move.type === 'EXPENSE' ? 'text-red-500' : 'text-green-600'}`}>
                          {move.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(move.amount, "COP")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {movements.length > 0 && (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar en mi Historial
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
