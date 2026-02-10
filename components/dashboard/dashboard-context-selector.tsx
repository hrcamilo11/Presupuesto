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
import { Users, User, Globe, Loader2 } from "lucide-react";
import { SharedAccount } from "@/lib/database.types";

export function DashboardContextSelector({ sharedAccounts }: { sharedAccounts: SharedAccount[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentContext = searchParams.get("context") || "global";

    function handleContextChange(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "global") {
            params.delete("context");
        } else {
            params.set("context", value);
        }

        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={currentContext} onValueChange={handleContextChange} disabled={isPending}>
                <SelectTrigger className="w-[180px]">
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        currentContext === "global" ? <Globe className="h-4 w-4 mr-2" /> :
                            currentContext === "personal" ? <User className="h-4 w-4 mr-2" /> :
                                <Users className="h-4 w-4 mr-2" />
                    )}
                    <SelectValue placeholder="Contexto" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="global">
                        <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2" />
                            Global
                        </div>
                    </SelectItem>
                    <SelectItem value="personal">
                        <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Personal
                        </div>
                    </SelectItem>
                    {sharedAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center text-xs">
                                <Users className="h-3 w-3 mr-2" />
                                {account.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
