import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { SettingsPageClient } from "./settings-client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getWallets } from "@/app/actions/wallets";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";
import { getNotificationPreferences } from "@/app/actions/notifications";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: categories } = await getCategories();
    const { data: tags } = await getTags();
    const [{ data: wallets }, { data: sharedAccounts }, { data: notifPrefs }] = await Promise.all([
        getWallets(),
        getMySharedAccounts(),
        getNotificationPreferences(),
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
            notificationPreferences={notifPrefs ?? undefined}
        />
    );
}
