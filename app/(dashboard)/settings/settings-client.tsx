"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LayoutGrid, Tag, Palette } from "lucide-react";
import { CategoryList } from "@/components/categories/category-list";
import { TagList } from "@/components/tags/tag-list";
import { Category, Tag as TagType } from "@/lib/database.types";

interface SettingsPageClientProps {
    categories: Category[];
    tags: TagType[];
}

export function SettingsPageClient({ categories, tags }: SettingsPageClientProps) {
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">
                    Administra tu perfil, categorías, etiquetas y preferencias.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Perfil</span>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">Categorías</span>
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="gap-2">
                        <Tag className="h-4 w-4" />
                        <span className="hidden sm:inline">Etiquetas</span>
                    </TabsTrigger>
                    <TabsTrigger value="personalization" className="gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Personalización</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <div className="rounded-lg border bg-card p-6">
                        <h2 className="text-xl font-semibold mb-4">Información del perfil</h2>
                        <p className="text-sm text-muted-foreground">
                            La gestión de perfil estará disponible próximamente.
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <CategoryList categories={categories} />
                </TabsContent>

                <TabsContent value="tags" className="space-y-4">
                    <TagList tags={tags} />
                </TabsContent>

                <TabsContent value="personalization" className="space-y-4">
                    <div className="rounded-lg border bg-card p-6">
                        <h2 className="text-xl font-semibold mb-4">Personalización del Dashboard</h2>
                        <p className="text-sm text-muted-foreground">
                            Las opciones de personalización estarán disponibles próximamente.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
