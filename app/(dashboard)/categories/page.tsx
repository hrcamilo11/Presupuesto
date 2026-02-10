import { getCategories } from "@/app/actions/categories";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryFormWrapper } from "@/components/categories/category-form-wrapper";

export default async function CategoriesPage() {
    const { data: categories } = await getCategories();

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
                    <p className="text-muted-foreground">Administra tus categorías personalizadas.</p>
                </div>
                <CategoryFormWrapper />
            </div>

            <CategoryList categories={categories || []} />
        </div>
    );
}
