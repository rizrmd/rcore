import { Error } from "@/components/ext/error";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPagination } from "@/components/ui/data-pagination";
import { Alert } from "@/components/ui/global-alert";
import { betterAuth } from "@/lib/better-auth";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { ItemLayoutEnum, formatDateObject } from "@/lib/utils";
import type { User } from "shared/types";
import { NotifStatus, NotifType } from "shared/types";
import type { Notif } from "shared/types";
import { Bell, ExternalLink, Eye, MessageSquare, Trash2 } from "lucide-react";

export const current = {
  user: undefined as User | undefined,
};

export default () => {
  const local = useLocal(
    {
      notifications: [] as Notif[],
      loading: true,
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
      error: "",
      layout: ItemLayoutEnum.GRID,
      options: { disableDelete: true },
    },
    async () => {
      const res = await betterAuth.getSession();
      current.user = res.data?.user;
      if (!current.user) return;
      const params = new URLSearchParams(location.search);
      local.page = parseInt(params.get("page") || "1") as number;
      local.limit = parseInt(params.get("limit") || "50") as number;
      await loadData();
    }
  );

  async function loadData() {
    try {
      const res = await api.notif_list({
        page: local.page,
        limit: local.limit,
        id_user: current.user?.id!,
      });
      local.notifications = res.data || [];
      local.total = res.pagination!.total || 0;
      local.page = res.pagination!.page || 0;
      local.limit = res.pagination!.limit || 0;
      local.totalPages = res.pagination!.totalPages || 0;
    } catch (error) {
      local.error = "Terjadi kesalahan saat memuat data.";
    } finally {
      local.loading = false;
      local.render();
    }
  }

  async function deleteNotification(notif: Notif) {
    const result = await Alert.confirm(
      "Apakah Anda yakin ingin menghapus notifikasi ini?"
    );

    if (result.confirm) {
      try {
        const res = await api.notif_delete({
          id_user: notif.id_user!,
          created_at: notif.created_at!,
        });

        if (res.success) {
          await loadData();
        } else {
          local.error = res.message || "Gagal menghapus notifikasi";
          local.render();
        }
      } catch (error) {
        local.error = "Terjadi kesalahan saat menghapus notifikasi";
        local.render();
      }
    }
  }

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
      // Reload data to reflect the status change
      await loadData();
    } catch (error) {
      console.error("Gagal memperbarui status notifikasi:", error);
    }

    if (notif.url) window.open(notif.url, "_blank", "noopener,noreferrer");
    else Alert.info("Tidak ada detail yang tersedia untuk notifikasi ini.");
  }

  function getNotificationIcon(type: NotifType, thumbnail?: string) {
    if (thumbnail) {
      return (
        <img
          src={thumbnail}
          alt="Notification"
          className="h-5 w-5 rounded object-cover"
        />
      );
    }

    switch (type) {
      case NotifType.BOOK_CREATE:
      case NotifType.BOOK_UPDATE:
      case NotifType.BOOK_SUBMIT:
        return <MessageSquare className="h-5 w-5" />;
      case NotifType.BOOK_PUBLISH:
      case NotifType.BOOK_APPROVE:
        return <Eye className="h-5 w-5 text-green-600" />;
      case NotifType.BOOK_REJECT:
      case NotifType.BOOK_REVISE:
        return <ExternalLink className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  }

  function getNotificationBadge(status: string) {
    return status === "unread" ? (
      <Badge className="bg-blue-500">Belum Dibaca</Badge>
    ) : (
      <Badge variant="secondary">Sudah Dibaca</Badge>
    );
  }

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Error msg={local.error} />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="mx-8 py-8">
              <div className="flex justify-between items-start mb-8 gap-4">
                <h1 className="mb-6 text-2xl font-bold">Daftar Notifikasi</h1>
                <DataPagination
                  total={local.total}
                  page={local.page}
                  limit={local.limit}
                  totalPages={local.totalPages}
                  onReload={loadData}
                  onPageChange={async (newPage) => {
                    local.page = newPage;
                    local.render();
                    await loadData();
                  }}
                  onLimitChange={async (newLimit) => {
                    local.limit = newLimit;
                    local.page = 1;
                    local.render();
                    await loadData();
                  }}
                  layout={local.layout}
                  onLayoutChange={(value) => {
                    local.layout = value;
                    local.render();
                  }}
                />
              </div>

              {local.loading ? (
                <div>Mengambil data notifikasi...</div>
              ) : local.notifications.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  Belum ada notifikasi.
                </div>
              ) : (
                <>
                  {local.layout === ItemLayoutEnum.GRID && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {local.notifications.map((notif: Notif) => (
                        <Card
                          key={`${notif.id_user}-${notif.created_at}`}
                          className="flex flex-col h-full shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                          <CardHeader className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                {getNotificationIcon(
                                  notif.type as NotifType,
                                  notif.thumbnail || undefined
                                )}
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm font-medium line-clamp-3">
                                    {notif.message}
                                  </CardTitle>
                                </div>
                              </div>
                              {!local.options.disableDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notif)}
                                  className="text-red-600 hover:text-red-800 h-6 w-6 p-0 flex-shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="flex flex-col gap-2">
                              <p className="text-xs text-gray-500">
                                {notif.created_at &&
                                  formatDateObject(new Date(notif.created_at))}
                              </p>
                              {notif.status &&
                                getNotificationBadge(notif.status)}
                              {notif.url && (
                                <button
                                  onClick={() => lihatDetail(notif)}
                                  className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  Lihat Detail{" "}
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {local.layout === ItemLayoutEnum.LIST && (
                    <div className="flex flex-col gap-4">
                      {local.notifications.map((notif: Notif) => (
                        <Card
                          key={`${notif.id_user}-${notif.created_at}`}
                          className="hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start p-4 gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(
                                notif.type as NotifType,
                                notif.thumbnail || undefined
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 mb-1">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {notif.created_at &&
                                      formatDateObject(
                                        new Date(notif.created_at)
                                      )}
                                  </p>
                                  {notif.url && (
                                    <button
                                      onClick={() => lihatDetail(notif)}
                                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      Lihat Detail{" "}
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {notif.status &&
                                    getNotificationBadge(notif.status)}
                                  {!local.options.disableDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteNotification(notif)}
                                      className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {local.layout === ItemLayoutEnum.COMPACT && (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left text-xs font-medium text-gray-600">
                              Pesan
                            </th>
                            <th className="p-2 text-left text-xs font-medium text-gray-600">
                              Tanggal
                            </th>
                            <th className="p-2 text-left text-xs font-medium text-gray-600">
                              Status
                            </th>
                            <th className="p-2 text-left text-xs font-medium text-gray-600">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {local.notifications.map((notif: Notif, index) => (
                            <tr
                              key={`${notif.id_user}-${notif.created_at}`}
                              className={`border-b hover:bg-muted/50 ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="p-2">
                                <div className="flex items-start gap-2">
                                  {getNotificationIcon(
                                    notif.type as NotifType,
                                    notif.thumbnail || undefined
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-2">
                                      {notif.message}
                                    </p>
                                    {notif.url && (
                                      <button
                                        onClick={() => lihatDetail(notif)}
                                        className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-1 cursor-pointer"
                                      >
                                        Lihat Detail{" "}
                                        <ExternalLink className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-2">
                                <p className="text-xs text-gray-500">
                                  {notif.created_at &&
                                    formatDateObject(
                                      new Date(notif.created_at)
                                    )}
                                </p>
                              </td>
                              <td className="p-2">
                                {notif.status &&
                                  getNotificationBadge(notif.status)}
                              </td>
                              <td className="p-2">
                                {!local.options.disableDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notif)}
                                    className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};
