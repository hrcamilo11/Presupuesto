import { getTags } from "@/app/actions/tags";
import { TagList } from "@/components/tags/tag-list";
import { TagFormWrapper } from "@/components/tags/tag-form-wrapper";

export default async function TagsPage() {
    const { data: tags } = await getTags();

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Etiquetas</h1>
                    <p className="text-muted-foreground">Organiza tus movimientos con etiquetas personalizadas.</p>
                </div>
                <TagFormWrapper />
            </div>

            <TagList tags={tags || []} />
        </div>
    );
}
