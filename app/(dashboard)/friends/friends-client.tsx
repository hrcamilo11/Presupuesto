"use client";

import { useState, useTransition } from "react";
import { Users, Search, UserPlus, Check, X, UserMinus, QrCode, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { searchUsers, sendFriendRequest, respondToFriendRequest, removeFriend } from "@/app/actions/social";
import { QRScanner } from "@/components/social/qr-scanner";
import type { FriendStatus, Profile } from "@/lib/database.types";

interface FriendsClientProps {
    initialFriends: { friendship_id: string, profile: Profile }[];
    initialPendingRequests: { id: string, user_id: string, created_at: string, sender: Profile }[];
    initialSentRequests: { id: string, friend_id: string, created_at: string, receiver: Profile }[];
}

export function FriendsClient({ initialFriends, initialPendingRequests, initialSentRequests }: FriendsClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [activeRequestTab, setActiveRequestTab] = useState<"received" | "sent">("received");
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<string | null>(null);

    async function handleSearch() {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        const { data, error } = await searchUsers(searchQuery);
        setSearchResults(data || []);
        if (error) setMsg(error);
        setIsSearching(false);
    }

    function handleSendRequest(friendId: string) {
        startTransition(async () => {
            const { error, message } = await sendFriendRequest(friendId);
            setMsg(error ? error : ((message as string) || "Solicitud de amistad enviada."));
            if (!error) {
                setSearchResults(prev => prev.filter(p => p.id !== friendId));
                router.refresh();
            }
        });
    }

    function handleResponse(requestId: string, status: FriendStatus) {
        startTransition(async () => {
            const { error } = await respondToFriendRequest(requestId, status);
            if (!error) {
                setMsg(status === 'accepted' ? "Petición aceptada." : "Petición rechazada.");
                router.refresh();
            } else {
                setMsg(error);
            }
        });
    }

    function handleRemove(friendshipId: string) {
        if (!confirm("¿Estás seguro de que quieres eliminar a este amigo?")) return;
        startTransition(async () => {
            const { error } = await removeFriend(friendshipId);
            if (!error) {
                setMsg("Amigo eliminado.");
                router.refresh();
            } else {
                setMsg(error);
            }
        });
    }

    function handleQRScan(decodedText: string) {
        // Expected format: budget-tracker:user:username
        if (decodedText.startsWith("budget-tracker:user:")) {
            const username = decodedText.replace("budget-tracker:user:", "");
            setIsScanning(false);
            setMsg("Procesando código QR...");

            startTransition(async () => {
                const { data, error: searchError } = await searchUsers(username);
                if (searchError) {
                    setMsg(searchError);
                    return;
                }

                const friend = data ? data[0] : null;
                if (!friend) {
                    setMsg("Usuario no encontrado.");
                    return;
                }

                const { error: requestError } = await sendFriendRequest(friend.id);
                setMsg(requestError ? requestError : `Solicitud enviada a ${friend.full_name || friend.username}.`);
            });
        } else {
            setMsg("Código QR no válido para esta aplicación.");
            setIsScanning(false);
        }
    }

    const totalRequests = initialPendingRequests.length + initialSentRequests.length;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 md:px-8">
            <header className="space-y-1 border-b border-border/80 pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Amigos</h1>
                        <p className="text-sm text-muted-foreground">
                            Busca contactos, añade amigos y gestiona tus conexiones.
                        </p>
                    </div>
                </div>
            </header>

            {msg && (
                <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary flex justify-between items-center">
                    {msg}
                    <Button variant="ghost" size="sm" onClick={() => setMsg(null)}><X className="h-4 w-4" /></Button>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list">Mis Amigos ({initialFriends.length})</TabsTrigger>
                            <TabsTrigger value="pending">
                                Solicitudes {totalRequests > 0 && `(${totalRequests})`}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="list" className="space-y-4 pt-4">
                            {initialFriends.length === 0 ? (
                                <Card>
                                    <CardContent className="pt-6 text-center text-muted-foreground">
                                        Aún no tienes amigos agregados.
                                    </CardContent>
                                </Card>
                            ) : (
                                initialFriends.map((f) => (
                                    <Card key={f.friendship_id}>
                                        <CardContent className="flex items-center justify-between py-4">
                                            <div>
                                                <p className="font-medium">{f.profile.full_name || f.profile.username}</p>
                                                <p className="text-sm text-muted-foreground">@{f.profile.username}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemove(f.friendship_id)}
                                                disabled={isPending}
                                            >
                                                <UserMinus className="h-4 w-4 mr-2" />
                                                Eliminar
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="pending" className="space-y-4 pt-4">
                            <div className="flex gap-2 mb-4 bg-muted/50 p-1 rounded-lg">
                                <Button
                                    variant={activeRequestTab === "received" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setActiveRequestTab("received")}
                                >
                                    Recibidas ({initialPendingRequests.length})
                                </Button>
                                <Button
                                    variant={activeRequestTab === "sent" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setActiveRequestTab("sent")}
                                >
                                    Enviadas ({initialSentRequests.length})
                                </Button>
                            </div>

                            {activeRequestTab === "received" ? (
                                initialPendingRequests.length === 0 ? (
                                    <Card>
                                        <CardContent className="pt-6 text-center text-muted-foreground">
                                            No tienes solicitudes recibidas.
                                        </CardContent>
                                    </Card>
                                ) : (
                                    initialPendingRequests.map((req) => (
                                        <Card key={req.id}>
                                            <CardContent className="flex items-center justify-between py-4">
                                                <div>
                                                    <p className="font-medium">{req.sender.full_name || req.sender.username}</p>
                                                    <p className="text-sm text-muted-foreground">@{req.sender.username}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500 text-green-600 hover:bg-green-50"
                                                        onClick={() => handleResponse(req.id, 'accepted')}
                                                        disabled={isPending}
                                                    >
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Aceptar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleResponse(req.id, 'rejected')}
                                                        disabled={isPending}
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Rechazar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )
                            ) : (
                                initialSentRequests.length === 0 ? (
                                    <Card>
                                        <CardContent className="pt-6 text-center text-muted-foreground">
                                            No tienes solicitudes enviadas.
                                        </CardContent>
                                    </Card>
                                ) : (
                                    initialSentRequests.map((req) => (
                                        <Card key={req.id}>
                                            <CardContent className="flex items-center justify-between py-4">
                                                <div>
                                                    <p className="font-medium">{req.receiver.full_name || req.receiver.username}</p>
                                                    <p className="text-sm text-muted-foreground">@{req.receiver.username}</p>
                                                    <p className="text-[10px] text-muted-foreground italic">Esperando respuesta...</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemove(req.id)}
                                                    disabled={isPending}
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancelar
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))
                                )
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Buscar Amigos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isScanning ? (
                                <div className="space-y-4">
                                    <QRScanner onScan={handleQRScan} />
                                    <Button variant="ghost" className="w-full" onClick={() => setIsScanning(false)}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Cancelar Escaneo
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Buscar por username..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                        <Button size="icon" onClick={handleSearch} disabled={isSearching}>
                                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <Button variant="outline" className="w-full gap-2" onClick={() => setIsScanning(true)}>
                                        <QrCode className="h-4 w-4" />
                                        Escanear QR
                                    </Button>

                                    <div className="space-y-2 pt-2">
                                        {searchResults.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{p.full_name || p.username}</p>
                                                    <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                                                </div>
                                                <Button size="sm" onClick={() => handleSendRequest(p.id)} disabled={isPending}>
                                                    <UserPlus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && searchQuery && !isSearching && (
                                            <p className="text-xs text-center text-muted-foreground">No se encontraron usuarios.</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
