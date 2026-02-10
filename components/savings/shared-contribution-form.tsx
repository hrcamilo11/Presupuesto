"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/use-toast";
import { contributeToSharedSavings } from "@/app/actions/savings";
import { contributionSchema, type ContributionSchema } from "@/lib/validations/savings";
import type { Wallet } from "@/lib/database.types";

type SharedContributionFormValues = ContributionSchema & {
  savings_goal_id: string;
};

export function SharedContributionForm({
  goalId,
  wallets,
}: {
  goalId: string;
  wallets: Wallet[];
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const resolver = zodResolver(
    contributionSchema
  ) as unknown as Resolver<SharedContributionFormValues>;

  const form = useForm<SharedContributionFormValues>({
    resolver,
    defaultValues: {
      savings_goal_id: goalId,
      wallet_id: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: SharedContributionFormValues) {
    const result = await contributeToSharedSavings({
      shared_savings_goal_id: values.savings_goal_id,
      wallet_id: values.wallet_id,
      amount: values.amount,
      date: values.date,
      notes: values.notes,
    });

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Ahorro compartido registrado",
        description: "Se han agregado fondos a la meta grupal.",
      });
      form.reset({
        savings_goal_id: goalId,
        wallet_id: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Agregar fondos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Fondos a Meta Compartida</DialogTitle>
          <DialogDescription>
            Transfiere dinero de una cuenta a esta meta de ahorro en grupo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta de origen</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto a transferir</FormLabel>
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transferir
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

