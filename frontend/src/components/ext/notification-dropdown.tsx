import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert } from "@/components/ui/global-alert";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { notif } from "@/lib/notif";
import { navigate } from "@/lib/router";
import { formatDateObject } from "@/lib/utils";
import type { User } from "shared/types";
import { NotifStatus, NotifType } from "shared/types";
import type { Notif } from "shared/types";
import { Bell, ExternalLink, Eye, MessageSquare } from "lucide-react";
import { useSnapshot } from "valtio";

export const NotifDropdown = ({ user }: { user: User }) => {
  const notifList = useSnapshot(notif.list);

  const local = useLocal(
    {
      notifications: [] as Notif[],
      loading: false,
      isOpen: false,
    },
    async () => {
      // Initialize notification WebSocket connection
      if (user?.id && !notif.ws) {
        notif.init(user.id);
      }
    }
  );

  // Use real-time notifications from WebSocket, fallback to API data
  const displayNotifs =
    notifList.length > 0
      ? (notifList.slice(0, 10).map((item) => ({
          id_user: user.id,
          created_at: new Date(item.timestamp || Date.now()),
          type: item.type,
          message: item.message,
          status: item.status,
          url: item.url,
          data: item.data,
          thumbnail: item.thumbnail,
        })) as Notif[])
      : local.notifications.slice(0, 10);

  const getNotifIcon = (type: NotifType, thumbnail?: string) => {
    if (thumbnail) {
      return (
        <img
          src={thumbnail}
          alt="Notification"
          className="h-4 w-4 rounded object-cover"
        />
      );
    }

    switch (type) {
      case NotifType.BOOK_CREATE:
      case NotifType.BOOK_UPDATE:
      case NotifType.BOOK_SUBMIT:
        return <MessageSquare className="h-4 w-4" />;
      case NotifType.BOOK_PUBLISH:
      case NotifType.BOOK_APPROVE:
        return <Eye className="h-4 w-4 text-green-600" />;
      case NotifType.BOOK_REJECT:
      case NotifType.BOOK_REVISE:
        return <ExternalLink className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  async function lihatDetail(notif: Notif) {
    // update status to "read"
    try {
      await api.notif_update({
        id_user: notif.id_user!,
        created_at: notif.created_at!,
        data: {
          status: NotifStatus.READ,
        },
      });
    } catch (error) {
      console.error("Gagal memperbarui status notifikasi:", error);
    }

    if (notif.url) {
      window.open(notif.url, "_blank", "noopener,noreferrer");
    } else {
      Alert.info("Tidak ada detail yang tersedia untuk notifikasi ini.");
    }
  }

  const unreadCount = displayNotifs.filter((n) => n.status === "unread").length;

  return (
    <DropdownMenu
      open={local.isOpen}
      onOpenChange={(isOpen) => {
        local.isOpen = isOpen;
        local.render();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
        sideOffset={8}
      >
        <div className="px-3 py-2 text-sm font-medium border-b">
          Notifikasi
          {unreadCount > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({unreadCount} belum dibaca)
            </span>
          )}
        </div>

        {displayNotifs.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            Belum ada notifikasi
          </div>
        ) : (
          <>
            {displayNotifs.map((notif, index) => (
              <DropdownMenuItem
                key={`${notif.id_user}-${notif.created_at}-${index}`}
                className="p-0 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  lihatDetail(notif);
                }}
              >
                <div className="flex items-start gap-3 p-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotifIcon(
                      notif.type as NotifType,
                      notif.thumbnail || undefined
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p
                      className={`text-sm ${
                        notif.status === "unread"
                          ? "font-medium"
                          : "font-normal"
                      }`}
                    >
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {notif.created_at &&
                          formatDateObject(new Date(notif.created_at))}
                      </p>
                      {notif.status === "unread" && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="justify-center font-medium text-primary cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                local.isOpen = false;
                local.render();
                navigate("/manage-notif");
              }}
            >
              Lihat Semua Notifikasi
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
