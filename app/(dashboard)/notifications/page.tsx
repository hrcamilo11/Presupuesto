import { getNotifications } from "@/app/actions/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const dynamic = "force-dynamic";

type SearchParams = { filter?: string };

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const unreadOnly = params.filter === "unread";
  const { data: notifications } = await getNotifications({
    limit: 100,
    unreadOnly,
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
        <p className="text-muted-foreground">
          Aquí aparecen recordatorios, avisos de préstamos, cuentas compartidas y más.
        </p>
      </div>
      <NotificationsList
        initialNotifications={notifications ?? []}
        filter={unreadOnly ? "unread" : "all"}
      />
    </div>
  );
}
