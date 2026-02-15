"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LayoutGrid, Tag, Palette, Loader2, Trash2, AlertTriangle, Bell, Settings, ChevronUp, ChevronDown, KeyRound } from "lucide-react";
import Link from "next/link";
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
import { updateNotificationPreferences, sendTestEmail } from "@/app/actions/notifications";
import { PushSubscribeButton } from "@/components/notifications/push-subscribe-button";
import { useTransition } from "react";
import type { NotificationPreferences } from "@/lib/database.types";

interface SettingsPageClientProps {
    categories: Category[];
    tags: TagType[];
    wallets: Wallet[];
    sharedAccounts: SharedAccount[];
    profile: Profile | null;
    notificationPreferences?: NotificationPreferences | null;
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

const DEFAULT_NOTIFICATION_PREFS = {
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
};

export function SettingsPageClient({ categories, tags, wallets, sharedAccounts, profile, notificationPreferences }: SettingsPageClientProps) {
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

    const mergedNotifPrefs = { ...DEFAULT_NOTIFICATION_PREFS, ...notificationPreferences };
    const [emailEnabled, setEmailEnabled] = useState(mergedNotifPrefs.email_enabled);
    const [pushEnabled, setPushEnabled] = useState(mergedNotifPrefs.push_enabled);
    const [notifMsg, setNotifMsg] = useState<string | null>(null);
    const [testEmailMsg, setTestEmailMsg] = useState<string | null>(null);

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

    function saveNotificationPrefs() {
        setNotifMsg(null);
        setTestEmailMsg(null);
        startTransition(async () => {
            const res = await updateNotificationPreferences({
                email_enabled: emailEnabled,
                push_enabled: pushEnabled,
            });
            setNotifMsg(res.error ? res.error : "Preferencias de notificaciones guardadas.");
        });
    }

    function handleSendTestEmail() {
        setTestEmailMsg(null);
        startTransition(async () => {
            const res = await sendTestEmail();
            setTestEmailMsg(res.error ? res.error : "Correo de prueba enviado. Revisa tu bandeja.");
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
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 md:px-8">
            {/* Cabecera */}
            <header className="space-y-1 border-b border-border/80 pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Settings className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Configuración</h1>
                        <p className="text-sm text-muted-foreground">
                            Perfil, categorías, etiquetas y preferencias del dashboard.
                        </p>
                    </div>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="inline-flex w-full justify-start gap-0.5 overflow-x-auto rounded-xl bg-muted/60 p-1.5 text-muted-foreground md:flex-wrap">
                    <TabsTrigger
                        value="profile"
                        className="gap-2 min-w-[120px] rounded-lg px-4 py-2 transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <User className="h-4 w-4 shrink-0" />
                        <span>Perfil</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="categories"
                        className="gap-2 min-w-[140px] rounded-lg px-4 py-2 transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <LayoutGrid className="h-4 w-4 shrink-0" />
                        <span>Categorías</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="tags"
                        className="gap-2 min-w-[130px] rounded-lg px-4 py-2 transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <Tag className="h-4 w-4 shrink-0" />
                        <span>Etiquetas</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="personalization"
                        className="gap-2 min-w-[170px] rounded-lg px-4 py-2 transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <Palette className="h-4 w-4 shrink-0" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="gap-2 min-w-[140px] rounded-lg px-4 py-2 transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <Bell className="h-4 w-4 shrink-0" />
                        <span>Notificaciones</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card className="overflow-hidden rounded-xl border border-border/80 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Información del perfil</CardTitle>
                            <p className="text-sm text-muted-foreground">Nombre, moneda y zona horaria para tu cuenta.</p>
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

                    <Card className="overflow-hidden rounded-xl border border-border/80 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <KeyRound className="h-5 w-5" />
                                Seguridad y cuenta
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Cambiar contraseña o eliminar tu cuenta y datos.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" asChild className="gap-2">
                                    <Link href="/update-password">
                                        <KeyRound className="h-4 w-4" />
                                        Cambiar contraseña
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild className="gap-2" id="link-eliminar-cuenta">
                                    <Link href="#zona-peligrosa">
                                        <Trash2 className="h-4 w-4" />
                                        Ir a eliminar / limpiar cuenta
                                    </Link>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                En la sección inferior puedes limpiar todos tus datos personales (irreversible). Para cerrar sesión usa el menú de usuario.
                            </p>
                        </CardContent>
                    </Card>

                    <Card id="zona-peligrosa" className="overflow-hidden rounded-xl border-2 border-destructive/30 bg-destructive/5 shadow-sm dark:bg-destructive/10 scroll-mt-4">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/20">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-destructive">
                                        Zona peligrosa: limpiar cuenta personal
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-0.5">Esta acción es irreversible.</p>
                                </div>
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

                            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/40 p-4">
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

                <TabsContent value="categories" className="space-y-6">
                    <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            Crea y edita categorías para clasificar ingresos y gastos. Cada categoría puede tener icono y color.
                        </p>
                    </div>
                    <CategoryList categories={categories} />
                </TabsContent>

                <TabsContent value="tags" className="space-y-6">
                    <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            Gestiona etiquetas para filtrar y organizar tus movimientos con más detalle.
                        </p>
                    </div>
                    <TagList tags={tags} />
                </TabsContent>

                <TabsContent value="personalization" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="overflow-hidden rounded-xl border border-border/80 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Preferencias por defecto</CardTitle>
                                <p className="text-sm text-muted-foreground">Contexto y cuenta al abrir el dashboard.</p>
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

                        <Card className="overflow-hidden rounded-xl border border-border/80 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Secciones visibles del dashboard</CardTitle>
                                <p className="text-sm text-muted-foreground">Activa o desactiva bloques en la página principal.</p>
                            </CardHeader>
                            <CardContent className="divide-y divide-border/60">
                                <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
                                    <div>
                                        <p className="text-sm font-medium">Resumen (tarjetas)</p>
                                        <p className="text-xs text-muted-foreground">Ingresos, gastos, balance y tasa ahorro.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_summary_cards} onCheckedChange={() => toggleDashSetting("show_summary_cards")} />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="text-sm font-medium">Presupuesto</p>
                                        <p className="text-xs text-muted-foreground">Resumen de presupuestos.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_budget_summary} onCheckedChange={() => toggleDashSetting("show_budget_summary")} />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="text-sm font-medium">Mis cuentas</p>
                                        <p className="text-xs text-muted-foreground">Vista rápida de cuentas.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_accounts_preview} onCheckedChange={() => toggleDashSetting("show_accounts_preview")} />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="text-sm font-medium">Metas de ahorro</p>
                                        <p className="text-xs text-muted-foreground">Vista rápida de metas.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_savings_goals} onCheckedChange={() => toggleDashSetting("show_savings_goals")} />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="text-sm font-medium">Tendencia</p>
                                        <p className="text-xs text-muted-foreground">Gráfico de 6 meses.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_trend_chart} onCheckedChange={() => toggleDashSetting("show_trend_chart")} />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="text-sm font-medium">Gráficas circulares</p>
                                        <p className="text-xs text-muted-foreground">Ingresos por tipo y gastos por prioridad.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_pie_charts} onCheckedChange={() => toggleDashSetting("show_pie_charts")} />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="text-sm font-medium">Distribución por categoría y etiqueta</p>
                                        <p className="text-xs text-muted-foreground">Muestra cómo se reparten ingresos y gastos.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_distribution_section} onCheckedChange={() => toggleDashSetting("show_distribution_section")} />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="text-sm font-medium">Deudas y obligaciones</p>
                                        <p className="text-xs text-muted-foreground">Resumen de préstamos, tarjetas y pendientes.</p>
                                    </div>
                                    <Switch checked={dashSettings.show_debts_section} onCheckedChange={() => toggleDashSetting("show_debts_section")} />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
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

                        <Card className="overflow-hidden rounded-xl border border-border/80 shadow-sm lg:col-span-2">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Orden de las secciones</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Usa las flechas para cambiar el orden en que aparecen las secciones en el dashboard.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {sectionsOrder.map((id, index) => (
                                    <div
                                        key={id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                                                {index + 1}
                                            </span>
                                            <span className="truncate font-medium">{SECTION_LABELS[id] ?? id}</span>
                                        </div>
                                        <div className="flex gap-0.5 shrink-0">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8"
                                                disabled={index === 0}
                                                onClick={() => moveSection(index, "up")}
                                                aria-label="Mover arriba"
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8"
                                                disabled={index === sectionsOrder.length - 1}
                                                onClick={() => moveSection(index, "down")}
                                                aria-label="Mover abajo"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-end pt-4">
                                    <Button onClick={saveDashboard} disabled={isPending} variant="outline">
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar orden"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card className="overflow-hidden rounded-xl border border-border/80 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Canales de notificación</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Elige cómo quieres recibir avisos: en la app, por correo o notificaciones del sistema (navegador o dispositivo).
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {notifMsg && (
                                <p className="text-sm text-muted-foreground">{notifMsg}</p>
                            )}
                            <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
                                <div>
                                    <p className="text-sm font-medium">Dentro de la app</p>
                                    <p className="text-xs text-muted-foreground">Siempre activo. Verás las notificaciones en la campana y en la página Notificaciones.</p>
                                </div>
                                <Switch checked={true} disabled aria-label="Notificaciones en la app (siempre activo)" />
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-border/60 py-4">
                                <div>
                                    <p className="text-sm font-medium">Correo electrónico</p>
                                    <p className="text-xs text-muted-foreground">Recibir un correo cuando se genere una notificación (requiere RESEND_API_KEY en .env).</p>
                                </div>
                                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                            </div>
                            {emailEnabled && (
                                <div className="rounded-lg border border-border/80 bg-muted/40 p-4">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">Probar envío</p>
                                    <Button type="button" variant="outline" size="sm" onClick={handleSendTestEmail} disabled={isPending}>
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Enviar correo de prueba
                                    </Button>
                                    {testEmailMsg && (
                                        <p className={`mt-2 text-xs ${testEmailMsg.startsWith("Correo") ? "text-muted-foreground" : "text-destructive"}`}>
                                            {testEmailMsg}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-4 border-t border-border/60 py-4">
                                <div>
                                    <p className="text-sm font-medium">Notificaciones del sistema</p>
                                    <p className="text-xs text-muted-foreground">Push en navegador o dispositivo aunque no tengas la app abierta.</p>
                                </div>
                                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                            </div>
                            {pushEnabled && (
                                <div className="rounded-lg border border-border/80 bg-muted/40 p-4">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">En este dispositivo</p>
                                    <PushSubscribeButton />
                                </div>
                            )}
                            <div className="flex justify-end">
                                <Button onClick={saveNotificationPrefs} disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar preferencias"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
