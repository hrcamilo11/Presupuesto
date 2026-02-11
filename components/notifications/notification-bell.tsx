"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Loader2,
  MessageSquare,
  AlertCircle,
  Info,
  Landmark,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "@/app/actions/notifications";
import type { Notification } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshUnread = useCallback(async () => {
    const { count } = await getUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getNotifications({ limit: 10 })
      .then(({ data }) => setList(data ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleMarkAsRead(id: string, link: string | null) {
    await markAsRead(id);
    setUnreadCount((c) => Math.max(0, c - 1));
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    if (link) {
      setOpen(false);
    }
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead();
    setUnreadCount(0);
    setList((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : "Notificaciones"}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
              aria-hidden
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] sm:w-[380px]" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="font-semibold text-sm">Notificaciones</span>
          {list.some((n) => !n.read_at) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Marcar todas leídas
            </Button>
          )}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay notificaciones
            </p>
          ) : (
            <ul className="py-1">
              {list.map((n) => {
                const Icon = typeIcons[n.type] ?? Info;
                const href = n.link || "/notifications";
                return (
                  <li key={n.id}>
                    <Link
                      href={href}
                      onClick={() => handleMarkAsRead(n.id, n.link)}
                      className={cn(
                        "flex gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent",
                        !n.read_at && "bg-primary/5"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        {n.body && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t p-2">
          <Link
            href="/notifications"
            className="block rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            Ver todas las notificaciones
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
