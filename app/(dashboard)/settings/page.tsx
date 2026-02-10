import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { SettingsPageClient } from "./settings-client";

export default async function SettingsPage() {
    const { data: categories } = await getCategories();
    const { data: tags } = await getTags();

    return (
        <SettingsPageClient
            categories={categories || []}
            tags={tags || []}
        />
    );
}
