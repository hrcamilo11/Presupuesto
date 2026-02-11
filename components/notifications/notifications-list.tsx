"use client";

import { useState } from "react";
import Link from "next/link";
import { markAsRead, markAllAsRead } from "@/app/actions/notifications";
import type { Notification } from "@/lib/database.types";
import {
  AlertCircle,
  Info,
  Landmark,
  MessageSquare,
  UsersRound,
  Wallet,
  CheckCheck,
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
}: {
  initialNotifications: Notification[];
}) {
  const [list, setList] = useState(initialNotifications);

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
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        </div>
      )}
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
              {href !== "#" ? (
                <Link
                  href={href}
                  onClick={() => handleMarkAsRead(n.id)}
                  className="flex gap-4 p-4 hover:bg-accent/50"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex gap-4 p-4">
                  {content}
                  {!n.read_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      Marcar leída
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
