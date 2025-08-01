import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "notif_delete",
  url: "/api/internal/notif/delete",
  async handler(arg: {
    id_user: string;
    created_at: Date;
  }): Promise<ApiResponse<void>> {
    try {
      const notif = await db.notif.findUnique({
        where: {
          id_user_created_at: {
            id_user: arg.id_user,
            created_at: arg.created_at,
          },
        },
      });
      if (!notif)
        return { success: false, message: "Notifikasi tidak ditemukan" };

      await db.notif.delete({
        where: {
          id_user_created_at: {
            id_user: arg.id_user,
            created_at: arg.created_at,
          },
        },
      });
      return { success: true };
    } catch (error) {
      console.error("Error in notif delete API:", error);
      return {
        success: false,
        message: "Terjadi kesalahan dalam menghapus notifikasi",
      };
    }
  },
});
