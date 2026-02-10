"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/use-toast";
import type { SharedAccount } from "@/lib/database.types";
import { createSharedSavingsGoal } from "@/app/actions/savings";

const sharedSavingsSchema = z.object({
  shared_account_id: z.string().uuid("Selecciona un grupo"),
  name: z.string().min(1, "El nombre es obligatorio"),
  target_amount: z.coerce.number().positive("La meta debe ser mayor a 0"),
  deadline: z.string().optional(),
});

type SharedSavingsFormValues = z.infer<typeof sharedSavingsSchema>;

export function SharedSavingsForm({ sharedAccounts }: { sharedAccounts: SharedAccount[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SharedSavingsFormValues>({
    defaultValues: {
      shared_account_id: "",
      name: "",
      target_amount: 0,
      deadline: undefined,
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: SharedSavingsFormValues) {
    const parsed = sharedSavingsSchema.safeParse(values);
    if (!parsed.success) {
      toast({
        variant: "destructive",
        title: "Datos inválidos",
        description: parsed.error.issues[0]?.message ?? "Revisa la información.",
      });
      return;
    }

    const result = await createSharedSavingsGoal(parsed.data);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Meta compartida creada",
        description: "Tu meta grupal ha sido creada.",
      });
      form.reset();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Meta Compartida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[430px]">
        <DialogHeader>
          <DialogTitle>Nueva Meta de Ahorro Compartida</DialogTitle>
          <DialogDescription>
            Crea una meta vinculada a uno de tus grupos compartidos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shared_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {sharedAccounts.map((sa) => (
                          <SelectItem key={sa.id} value={sa.id}>
                            {sa.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Viaje en grupo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto objetivo</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder="0"
                      value={field.value ?? 0}
                      onChange={(val) => field.onChange(val)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha límite (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Meta Compartida
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

