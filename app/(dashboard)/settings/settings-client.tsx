"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LayoutGrid, Tag, Palette, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { CategoryList } from "@/components/categories/category-list";
import { TagList } from "@/components/tags/tag-list";
import { Category, Tag as TagType, type Profile, type SharedAccount, type Wallet } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateMyDashboardSettings, updateMyProfileBasics, wipeMyPersonalData } from "@/app/actions/profile";
import { useTransition } from "react";

interface SettingsPageClientProps {
    categories: Category[];
    tags: TagType[];
    wallets: Wallet[];
    sharedAccounts: SharedAccount[];
    profile: Profile | null;
}

const DEFAULT_DASHBOARD_SETTINGS = {
    show_summary_cards: true,
    show_budget_summary: true,
    show_accounts_preview: true,
    show_savings_goals: true,
    show_trend_chart: true,
    show_pie_charts: true,
    show_quick_access: true,
    show_distribution_section: true,
    show_debts_section: true,
};

const DEFAULT_SECTIONS_ORDER = [
    "summary_cards",
    "savings_totals",
    "budgets_accounts_savings",
    "ring_trend",
    "debts_section",
    "pie_charts",
    "distribution_section",
    "quick_access",
] as const;

export function SettingsPageClient({ categories, tags, wallets, sharedAccounts, profile }: SettingsPageClientProps) {
    const [activeTab, setActiveTab] = useState("profile");
    const [isPending, startTransition] = useTransition();

    // Perfil
    const [fullName, setFullName] = useState(profile?.full_name ?? "");
    const [currency, setCurrency] = useState(profile?.currency ?? "COP");
    const [timezone, setTimezone] = useState(profile?.timezone ?? "America/Bogota");
    const [profileMsg, setProfileMsg] = useState<string | null>(null);

    // Dashboard
    const mergedDash = { ...DEFAULT_DASHBOARD_SETTINGS, ...(profile?.dashboard_settings ?? {}) };
    const [defaultContext, setDefaultContext] = useState(profile?.default_dashboard_context ?? "global");
    const [defaultWalletId, setDefaultWalletId] = useState(profile?.default_wallet_id ?? "all");
    const [dashSettings, setDashSettings] = useState(mergedDash);
    const [sectionsOrder, setSectionsOrder] = useState<string[]>(
        (profile?.dashboard_settings?.sections_order as string[] | undefined) ?? [...DEFAULT_SECTIONS_ORDER]
    );
    const [dashMsg, setDashMsg] = useState<string | null>(null);

    // Limpieza de cuenta personal
    const [wipeMsg, setWipeMsg] = useState<string | null>(null);
    const [wipeConfirm1, setWipeConfirm1] = useState(false);
    const [wipeConfirm2, setWipeConfirm2] = useState(false);
    const [wipeConfirm3, setWipeConfirm3] = useState(false);
    const [wipePassword, setWipePassword] = useState("");

    function toggleDashSetting(key: keyof typeof DEFAULT_DASHBOARD_SETTINGS) {
        setDashSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    const SECTION_LABELS: Record<string, string> = {
        summary_cards: "Resumen (tarjetas)",
        savings_totals: "Totales de ahorro",
        budgets_accounts_savings: "Presupuesto, cuentas y metas",
        ring_trend: "Ingresos vs gastos y tendencia",
        debts_section: "Deudas y obligaciones",
        pie_charts: "Gráficas circulares",
        distribution_section: "Distribución por categoría y etiqueta",
        quick_access: "Accesos rápidos",
    };

    function moveSection(index: number, direction: "up" | "down") {
        setSectionsOrder((prev) => {
            const next = [...prev];
            const newIndex = direction === "up" ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= next.length) return prev;
            const temp = next[index];
            next[index] = next[newIndex];
            next[newIndex] = temp;
            return next;
        });
    }

    function saveProfile() {
        setProfileMsg(null);
        startTransition(async () => {
            const res = await updateMyProfileBasics({
                full_name: fullName ? fullName : null,
                currency,
                timezone,
            });
            setProfileMsg(res.error ? res.error : "Perfil actualizado.");
        });
    }

    function saveDashboard() {
        setDashMsg(null);
        startTransition(async () => {
            const res = await updateMyDashboardSettings({
                default_dashboard_context: defaultContext,
                default_wallet_id: defaultWalletId === "all" ? null : defaultWalletId,
                dashboard_settings: {
                    ...dashSettings,
                    sections_order: sectionsOrder,
                },
            });
            setDashMsg(res.error ? res.error : "Preferencias del dashboard actualizadas.");
        });
    }

    function handleWipeAccount() {
        if (!wipeConfirm1 || !wipeConfirm2 || !wipeConfirm3 || !wipePassword) return;
        setWipeMsg(null);
        startTransition(async () => {
            const res = await wipeMyPersonalData({ password: wipePassword });
            setWipeMsg(
                res.error
                    ? res.error
                    : "Tu cuenta personal se ha limpiado. Tus cuentas compartidas no fueron afectadas.",
            );
            if (!res.error) {
                setWipeConfirm1(false);
                setWipeConfirm2(false);
                setWipeConfirm3(false);
                setWipePassword("");
            }
        });
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-10 md:px-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">
                    Administra tu perfil, categorías, etiquetas y preferencias.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="w-full justify-start gap-1 overflow-x-auto rounded-xl">
                    <TabsTrigger value="profile" className="gap-2 min-w-[120px]">
                        <User className="h-4 w-4" />
                        <span>Perfil</span>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2 min-w-[140px]">
                        <LayoutGrid className="h-4 w-4" />
                        <span>Categorías</span>
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="gap-2 min-w-[130px]">
                        <Tag className="h-4 w-4" />
                        <span>Etiquetas</span>
                    </TabsTrigger>
                    <TabsTrigger value="personalization" className="gap-2 min-w-[170px]">
                        <Palette className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Información del perfil</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profileMsg && (
                                <p className="text-sm text-muted-foreground">{profileMsg}</p>
                            )}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Nombre</Label>
                                    <Input
                                        id="full_name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Moneda</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Moneda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="COP">COP</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Se usa como preferencia; los montos actuales se mantienen tal como están registrados.
                                    </p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Zona horaria</Label>
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Zona horaria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="America/Bogota">America/Bogota</SelectItem>
                                            <SelectItem value="America/Mexico_City">America/Mexico_City</SelectItem>
                                            <SelectItem value="America/Lima">America/Lima</SelectItem>
                                            <SelectItem value="America/Santiago">America/Santiago</SelectItem>
                                            <SelectItem value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={saveProfile} disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-destructive/40">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <CardTitle className="text-destructive">
                                    Zona peligrosa: limpiar cuenta personal
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {wipeMsg && (
                                <p className="text-sm text-muted-foreground">{wipeMsg}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Esta acción borrará todas las transacciones y movimientos de tu cuenta
                                personal (ingresos, gastos, préstamos, ahorros, presupuestos y transferencias)
                                y pondrá en cero el saldo de tus cuentas personales. No afecta ninguna cuenta
                                compartida.
                            </p>

                            <div className="space-y-3 rounded-md bg-muted/60 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-muted-foreground">
                                        1. Entiendo que se borrarán todos mis datos financieros personales.
                                    </p>
                                    <Switch
                                        checked={wipeConfirm1}
                                        onCheckedChange={(v) => setWipeConfirm1(!!v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-muted-foreground">
                                        2. Entiendo que esta acción es irreversible.
                                    </p>
                                    <Switch
                                        checked={wipeConfirm2}
                                        onCheckedChange={(v) => setWipeConfirm2(!!v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-muted-foreground">
                                        3. Confirmo que quiero limpiar mi cuenta personal.
                                    </p>
                                    <Switch
                                        checked={wipeConfirm3}
                                        onCheckedChange={(v) => setWipeConfirm3(!!v)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="wipe_password">Contraseña de tu cuenta</Label>
                                <Input
                                    id="wipe_password"
                                    type="password"
                                    value={wipePassword}
                                    onChange={(e) => setWipePassword(e.target.value)}
                                    placeholder="Ingresa tu contraseña para confirmar"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Se usará solo para confirmar tu identidad antes de ejecutar la limpieza.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={
                                        isPending ||
                                        !wipeConfirm1 ||
                                        !wipeConfirm2 ||
                                        !wipeConfirm3 ||
                                        !wipePassword
                                    }
                                    onClick={handleWipeAccount}
                                >
                                    {isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Limpiar cuenta personal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <CategoryList categories={categories} />
                </TabsContent>

                <TabsContent value="tags" className="space-y-4">
                    <TagList tags={tags} />
                </TabsContent>

                <TabsContent value="personalization" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Preferencias por defecto</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {dashMsg && (
                                    <p className="text-sm text-muted-foreground">{dashMsg}</p>
                                )}

                                <div className="space-y-2">
                                    <Label>Contexto inicial</Label>
                                    <Select value={defaultContext} onValueChange={setDefaultContext}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Contexto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="global">Global</SelectItem>
                                            <SelectItem value="personal">Personal</SelectItem>
                                            {sharedAccounts.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    {a.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Se aplicará cuando entres al dashboard sin un filtro seleccionado.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Cuenta inicial</Label>
                                    <Select value={defaultWalletId} onValueChange={setDefaultWalletId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las cuentas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las cuentas</SelectItem>
                                            {wallets.map((w) => (
                                                <SelectItem key={w.id} value={w.id}>
                                                    {w.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={saveDashboard} disabled={isPending}>
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Secciones visibles del dashboard</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Resumen (tarjetas)</p>
                                        <p className="text-xs text-muted-foreground">Ingresos, gastos, balance y tasa ahorro.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_summary_cards} onCheckedChange={() => toggleDashSetting("show_summary_cards")} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Presupuesto</p>
                                        <p className="text-xs text-muted-foreground">Resumen de presupuestos.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_budget_summary} onCheckedChange={() => toggleDashSetting("show_budget_summary")} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Mis cuentas</p>
                                        <p className="text-xs text-muted-foreground">Vista rápida de cuentas.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_accounts_preview} onCheckedChange={() => toggleDashSetting("show_accounts_preview")} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Metas de ahorro</p>
                                        <p className="text-xs text-muted-foreground">Vista rápida de metas.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_savings_goals} onCheckedChange={() => toggleDashSetting("show_savings_goals")} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Tendencia</p>
                                        <p className="text-xs text-muted-foreground">Gráfico de 6 meses.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_trend_chart} onCheckedChange={() => toggleDashSetting("show_trend_chart")} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Gráficas circulares</p>
                                        <p className="text-xs text-muted-foreground">Ingresos por tipo y gastos por prioridad.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_pie_charts} onCheckedChange={() => toggleDashSetting("show_pie_charts")} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Distribución por categoría y etiqueta</p>
                                        <p className="text-xs text-muted-foreground">Muestra cómo se reparten ingresos y gastos.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_distribution_section} onCheckedChange={() => toggleDashSetting("show_distribution_section")} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Deudas y obligaciones</p>
                                        <p className="text-xs text-muted-foreground">Resumen de préstamos, tarjetas y pendientes.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_debts_section} onCheckedChange={() => toggleDashSetting("show_debts_section")} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Accesos rápidos</p>
                                        <p className="text-xs text-muted-foreground">Acciones principales.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_quick_access} onCheckedChange={() => toggleDashSetting("show_quick_access")} />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button onClick={saveDashboard} disabled={isPending} variant="outline">
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar cambios"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Orden de las secciones</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    Arrastra visualmente con los botones para decidir qué secciones aparecen primero.
                                </p>
                                <div className="space-y-2">
                                    {sectionsOrder.map((id, index) => (
                                        <div
                                            key={id}
                                            className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
                                        >
                                            <span className="truncate">{SECTION_LABELS[id] ?? id}</span>
                                            <div className="flex gap-1">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={index === 0}
                                                    onClick={() => moveSection(index, "up")}
                                                    aria-label="Mover arriba"
                                                >
                                                    ↑
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={index === sectionsOrder.length - 1}
                                                    onClick={() => moveSection(index, "down")}
                                                    aria-label="Mover abajo"
                                                >
                                                    ↓
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button onClick={saveDashboard} disabled={isPending} variant="outline">
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar orden"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
