import type { User } from "backend/lib/better-auth";
import type { ApiResponse } from "backend/lib/utils";
import { defineAPI } from "rlib/server";

interface PurchaseHistoryRequest {
  user: Partial<User>;
  page?: number;
  limit?: number;
  status?: string; // all, pending, paid, failed, expired, canceled
}

interface PurchaseHistoryItem {
  id: string;
  order_id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    type: "product" | "bundle";
  }>;
  payment_type?: string;
}

interface PurchaseHistoryResponse {
  purchases: PurchaseHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default defineAPI({
  name: "purchase_history",
  url: "/api/main/user/purchases",
  async handler(
    arg: PurchaseHistoryRequest
  ): Promise<ApiResponse<PurchaseHistoryResponse>> {
    try {
      // Validasi user login
      if (!arg.user?.id)
        return {
          success: false,
          message: "Pengguna harus login untuk melihat riwayat pembelian",
        };

      const page = arg.page || 1;
      const limit = arg.limit || 10;
      const skip = (page - 1) * limit;

      // Get customer data
      const customer = await db.customer.findFirst({
        where: { auth_user: { id: arg.user.id } },
      });

      if (!customer)
        return { success: false, message: "Data pelanggan tidak ditemukan" };

      // Build where clause
      const where: any = {
        id_customer: customer.id,
        status: { not: "cart" }, // Exclude cart items
      };

      if (arg.status && arg.status !== "all") where.status = arg.status;

      // Get total count
      const total = await db.t_sales.count({ where });

      // Get purchases with items
      const purchases = await db.t_sales.findMany({
        where,
        include: {
          t_sales_line: {
            include: {
              product: { select: { id: true, name: true } },
              bundle: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      });

      // Transform data
      const purchaseItems: PurchaseHistoryItem[] = purchases.map(
        (purchase) => ({
          id: purchase.id,
          order_id: purchase.midtrans_order_id,
          status: purchase.status,
          total_amount: Number(purchase.total),
          currency: purchase.currency,
          created_at: purchase.created_at.toISOString(),
          updated_at:
            purchase.updated_at?.toISOString() ||
            purchase.created_at.toISOString(),
          items: purchase.t_sales_line.map((line) => ({
            name: line.product?.name || line.bundle?.name || "Unknown Item",
            quantity: line.qty,
            price: Number(line.unit_price),
            type: line.product ? ("product" as const) : ("bundle" as const),
          })),
          payment_type:
            (purchase.midtrans_success as any)?.payment_type ||
            (purchase.midtrans_pending as any)?.payment_type,
        })
      );

      return {
        success: true,
        data: {
          purchases: purchaseItems,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error("Error fetching purchase history:", error);
      return {
        success: false,
        message: "Gagal mengambil riwayat pembelian",
      };
    }
  },
});
