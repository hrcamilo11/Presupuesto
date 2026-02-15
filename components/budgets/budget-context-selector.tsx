"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, User, Loader2 } from "lucide-react";
import type { SharedAccount } from "@/lib/database.types";

export function BudgetContextSelector({ sharedAccounts }: { sharedAccounts: SharedAccount[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const context = searchParams.get("context") || "personal";

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "personal") {
            params.delete("context");
        } else {
            params.set("context", value);
        }
        startTransition(() => {
            router.push(`/budgets?${params.toString()}`);
        });
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={context} onValueChange={handleChange} disabled={isPending}>
                <SelectTrigger className="w-[200px]">
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : context === "personal" ? (
                        <User className="h-4 w-4 mr-2" />
                    ) : (
                        <Users className="h-4 w-4 mr-2" />
                    )}
                    <SelectValue placeholder="Contexto" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="personal">
                        <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Personales
                        </div>
                    </SelectItem>
                    {sharedAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {account.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
