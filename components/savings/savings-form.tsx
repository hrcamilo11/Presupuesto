"use client";

import { useState } from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { savingsGoalSchema, type SavingsGoalSchema } from "@/lib/validations/savings";
import { createSavingsGoal } from "@/app/actions/savings";
import { Wallet } from "@/lib/database.types";

export function SavingsGoalForm({ wallets = [] }: { wallets?: Wallet[] }) {
    const [open, setOpen] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<SavingsGoalSchema>({
        resolver: zodResolver(savingsGoalSchema),
        defaultValues: {
            name: "",
            target_amount: 0,
            type: "manual",
            plan: {
                wallet_id: "",
                amount: 0,
                frequency: "monthly",
                day_of_period: 1,
            }
        },
    });

    const isLoading = form.formState.isSubmitting;

    async function onSubmit(data: SavingsGoalSchema) {
        console.log("Form submitted with data:", data);
        try {
            if (!isRecurring) {
                data.type = "manual";
                delete data.plan;
            } else {
                data.type = "recurring";
                // If amount is still 0 or empty, try to ensure it's a number
                if (data.plan) {
                    data.plan.amount = Number(data.plan.amount);
                    data.plan.day_of_period = Number(data.plan.day_of_period) || 1;
                }
            }

            // Ensure shared_account_id is null if it's empty string
            if (!data.shared_account_id) {
                data.shared_account_id = null;
            }

            console.log("Calling createSavingsGoal server action...");
            const result = await createSavingsGoal(data);
            console.log("Server action finished with result:", result);

            if (result.error) {
                console.error("Server error:", result.error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error,
                });
            } else {
                console.log("Goal created success, resetting form");
                toast({
                    title: "Meta creada",
                    description: isRecurring
                        ? "Meta y plan de ahorro recurrente creados."
                        : "Tu meta de ahorro ha sido creada.",
                });
                form.reset();
                setIsRecurring(false);
                setOpen(false);
                router.refresh();
            }
        } catch (error: unknown) {
            console.error("Client-side error in onSubmit:", error);
            toast({
                variant: "destructive",
                title: "Error inesperado",
                description: error instanceof Error ? error.message : "Ocurrió un error al procesar el formulario",
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Meta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nueva Meta de Ahorro</DialogTitle>
                    <DialogDescription>
                        Define un objetivo para empezar a ahorrar.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }: { field: ControllerRenderProps<SavingsGoalSchema, "name"> }) => (
                                <FormItem>
                                    <FormLabel>Nombre de la meta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Viaje a Japón, Auto nuevo..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="target_amount"
                            render={({ field }: { field: ControllerRenderProps<SavingsGoalSchema, "target_amount"> }) => (
                                <FormItem>
                                    <FormLabel>Monto objetivo</FormLabel>
                                    <FormControl>
                                        <CurrencyInput
                                            placeholder="0"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label>Ahorro Recurrente</Label>
                                <p className="text-[12px] text-muted-foreground">
                                    Apartar dinero automáticamente.
                                </p>
                            </div>
                            <Switch
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                            />
                        </div>

                        {isRecurring && (
                            <div className="space-y-4 rounded-lg bg-muted/50 p-3 animate-in slide-in-from-top-2">
                                <FormField
                                    control={form.control}
                                    name="plan.wallet_id"
                                    render={({ field }: { field: ControllerRenderProps<SavingsGoalSchema, "plan.wallet_id"> }) => (
                                        <FormItem>
                                            <FormLabel>Cuenta de origen</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona cuenta..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {wallets.map((w) => (
                                                        <SelectItem key={w.id} value={w.id}>
                                                            {w.name} (${w.balance})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="plan.amount"
                                        render={({ field }: { field: ControllerRenderProps<SavingsGoalSchema, "plan.amount"> }) => (
                                            <FormItem>
                                                <FormLabel>Monto a ahorrar</FormLabel>
                                                <FormControl>
                                                    <CurrencyInput
                                                        placeholder="0"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="plan.frequency"
                                        render={({ field }: { field: ControllerRenderProps<SavingsGoalSchema, "plan.frequency"> }) => (
                                            <FormItem>
                                                <FormLabel>Frecuencia</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="weekly">Semanal</SelectItem>
                                                        <SelectItem value="monthly">Mensual</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {!isRecurring && (
                            <FormField
                                control={form.control}
                                name="target_date"
                                render={({ field }: { field: ControllerRenderProps<SavingsGoalSchema, "target_date"> }) => (
                                    <FormItem>
                                        <FormLabel>Fecha objetivo (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            ¿Cuándo quieres alcanzar esta meta?
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Meta {isRecurring && "con Plan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
