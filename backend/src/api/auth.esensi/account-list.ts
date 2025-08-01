import { defineAPI } from "rlib/server";
import type { Account } from "shared/types";
import type { ApiResponse } from "../../lib/utils";

export default defineAPI({
  name: "account_list",
  url: "/api/auth/account/list",
  async handler(arg: {
    page?: number;
    limit?: number;
    id_user?: string;
  }): Promise<ApiResponse<Account[]>> {
    try {
      const page = arg.page || 1;
      const limit = arg.limit || 10;
      const skip = (page - 1) * limit;
      const where: any = {};

      if (arg.id_user) where.id_user = arg.id_user;

      const total = await db.auth_account.count({ where });
      const account = await db.auth_account.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: { auth_user: true },
      });

      return {
        success: true,
        data: account,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error in auth_account list API:", error);
      return {
        success: false,
        message: "Terjadi kesalahan dalam mengambil daftar akun",
      };
    }
  },
});
