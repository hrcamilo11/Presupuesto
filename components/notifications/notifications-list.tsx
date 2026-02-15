"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markAsRead, markAllAsRead, deleteNotification } from "@/app/actions/notifications";
import type { Notification } from "@/lib/database.types";
import {
  AlertCircle,
  Info,
  Landmark,
  MessageSquare,
  UsersRound,
  Wallet,
  CheckCheck,
  Trash2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  reminder: MessageSquare,
  loan: Landmark,
  shared: UsersRound,
  budget: Wallet,
  alert: AlertCircle,
};

export function NotificationsList({
  initialNotifications,
  filter: initialFilter = "all",
}: {
  initialNotifications: Notification[];
  filter?: "all" | "unread";
}) {
  const router = useRouter();
  const [list, setList] = useState(initialNotifications);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleMarkAsRead(id: string) {
    await markAsRead(id);
    setList((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead();
    setList((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta notificación?")) return;
    setDeletingId(id);
    await deleteNotification(id);
    setList((prev) => prev.filter((n) => n.id !== id));
    setDeletingId(null);
    router.refresh();
  }

  function setFilter(value: "all" | "unread") {
    const params = new URLSearchParams();
    if (value === "unread") params.set("filter", "unread");
    router.push(`/notifications${params.toString() ? `?${params.toString()}` : ""}`);
  }

  if (list.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No tienes notificaciones.
      </div>
    );
  }

  const unreadCount = list.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ver:</span>
          <Button
            variant={initialFilter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todas
          </Button>
          <Button
            variant={initialFilter === "unread" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            No leídas
          </Button>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>
      <ul className="space-y-1">
        {list.map((n) => {
          const Icon = typeIcons[n.type] ?? Info;
          const href = n.link || "#";
          const content = (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.title}</p>
                {n.body && (
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </>
          );
          return (
            <li
              key={n.id}
              className={`rounded-lg border bg-card transition-colors ${
                !n.read_at ? "border-primary/20 bg-primary/5" : ""
              }`}
            >
              <div className="flex gap-4 p-4 items-start">
                {href !== "#" ? (
                  <Link
                    href={href}
                    onClick={() => handleMarkAsRead(n.id)}
                    className="flex gap-4 flex-1 min-w-0 hover:bg-accent/50 -m-4 p-4 rounded-lg"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex gap-4 flex-1 min-w-0">{content}</div>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read_at && href === "#" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      Marcar leída
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(n.id)}
                    disabled={deletingId === n.id}
                    aria-label="Eliminar notificación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
