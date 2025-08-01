import { type User } from "backend/lib/better-auth";
import type { ApiResponse } from "backend/src/lib/utils";
import { defineAPI } from "rlib/server";
import type { t_sales, t_sales_line } from "shared/models";

type TSalesWithLines = t_sales & {
  t_sales_line: t_sales_line[];
};

export default defineAPI({
  name: "t_sales",
  url: "/api/t-sales/list",
  async handler(arg: {
    page?: number;
    limit?: number;
    user: Partial<User>;
    status: string;
  }): Promise<ApiResponse<TSalesWithLines[]>> {
    try {
      const page = arg.page || 1;
      const limit = arg.limit || 10;
      const skip = (page - 1) * limit;
      const userID = arg.user?.id || undefined;

      if (!userID) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      const statuses = [
        "pending",
        "paid",
        "canceled",
        "fraud",
        "expired",
        "refunded",
      ];

      const trxs_where =
        arg.status && arg.status !== "all" && statuses.includes(arg.status)
          ? {
              id_customer: userID,
              status: arg.status,
            }
          : { id_customer: userID };

      const total = await db.t_sales.count({ where: trxs_where });
      const trxs = await db.t_sales.findMany({
        where: trxs_where,
        include: { t_sales_line: true },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      });

      return {
        success: true,
        data: trxs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error in history API:", error);
      return {
        success: false,
        message: "Terjadi kesalahan dalam mengambil riwayat transaksi",
      };
    }
  },
});
