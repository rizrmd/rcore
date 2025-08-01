import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";
import type { notif } from "shared/models";
import type { Notif } from "shared/types";

export default defineAPI({
  name: "notif_create",
  url: "/api/internal/notif/create",
  async handler(arg: { data: Partial<notif> }): Promise<ApiResponse<Notif>> {
    try {
      const created = await db.notif.create({
        data: {
          id_user: arg.data.id_user!,
          message: arg.data.message?.trim()!,
          type: arg.data.type!,
          status: arg.data.status || "unread",
          url: arg.data.url || undefined,
          data: arg.data.data || undefined,
          thumbnail: arg.data.thumbnail || undefined,
        },
        include: { auth_user: true },
      });

      if (!created)
        return { success: false, message: "Notifikasi tidak ditemukan" };
      return { success: true, data: created };
    } catch (error) {
      console.error("Error in notif create API:", error);
      return {
        success: false,
        message: "Terjadi kesalahan dalam menambahkan notifikasi",
      };
    }
  },
});
