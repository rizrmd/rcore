import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";
import type { Notif } from "shared/types";

export default defineAPI({
  name: "notif_list",
  url: "/api/internal/notif/list",
  async handler(arg: {
    page?: number;
    limit?: number;
    id_user?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Notif[]>> {
    try {
      const page = arg.page || 1;
      const limit = arg.limit || 10;
      const skip = (page - 1) * limit;
      const where: any = {};

      if (arg.id_user) where.id_user = arg.id_user;

      if (arg.status) where.status = arg.status;

      if (arg.search)
        where.OR = [
          { message: { contains: arg.search, mode: "insensitive" } },
          { type: { contains: arg.search, mode: "insensitive" } },
        ];

      const total = await db.notif.count({ where });
      const notif = await db.notif.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: { auth_user: true },
      });

      return {
        success: true,
        data: notif,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error in notif list API:", error);
      return {
        success: false,
        message: "Terjadi kesalahan dalam mengambil daftar notifikasi",
      };
    }
  },
});
