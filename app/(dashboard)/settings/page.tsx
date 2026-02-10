import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { SettingsPageClient } from "./settings-client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getWallets } from "@/app/actions/wallets";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: categories } = await getCategories();
    const { data: tags } = await getTags();
    const [{ data: wallets }, { data: sharedAccounts }] = await Promise.all([
        getWallets(),
        getMySharedAccounts(),
    ]);

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <SettingsPageClient
            categories={categories || []}
            tags={tags || []}
            wallets={wallets || []}
            sharedAccounts={sharedAccounts || []}
            profile={profile ?? null}
        />
    );
}
