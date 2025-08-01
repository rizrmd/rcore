import type { User } from "backend/lib/better-auth";
import type { ApiResponse } from "backend/lib/utils";
import { defineAPI } from "rlib/server";

interface HistoryRequest {
  user: Partial<User>;
  page?: number;
  limit?: number;
  filter?: string; // semua, berhasil, dibatalkan, menunggu_pembayaran, kadaluwarsa, ditolak
}

interface HistoryItem {
  id: string;
  order_id: string;
  title: string;
  thumbnail: string;
  status: string;
  status_label: string;
  total_amount: number;
  currency: string;
  purchase_date: string;
  purchase_time: string;
  formatted_price: string;
  items: Array<{
    name: string;
    thumbnail: string;
    quantity: number;
    price: number;
    type: "product" | "bundle";
  }>;
}

interface HistoryResponse {
  transactions: HistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filter_stats: Array<{
    key: string;
    label: string;
    count: number;
  }>;
}

// Helper function to get status label in Indonesian
function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    pending: "Menunggu Pembayaran",
    paid: "Berhasil",
    failed: "Gagal",
    expired: "Kadaluwarsa",
    canceled: "Dibatalkan",
    fraud: "Ditolak",
    refunded: "Dikembalikan",
  };
  return statusLabels[status] || status;
}

// Helper function to format Indonesian Rupiah
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("IDR", "Rp.");
}

// Helper function to map filter to database status
function mapFilterToStatus(filter?: string): string[] {
  const filterMapping: Record<string, string[]> = {
    semua: [
      "pending",
      "paid",
      "failed",
      "expired",
      "canceled",
      "fraud",
      "refunded",
    ],
    berhasil: ["paid"],
    dibatalkan: ["canceled"],
    menunggu_pembayaran: ["pending"],
    kadaluwarsa: ["expired"],
    ditolak: ["fraud", "failed"],
  };

  if (!filter || filter === "semua") {
    return [
      "pending",
      "paid",
      "failed",
      "expired",
      "canceled",
      "fraud",
      "refunded",
    ];
  }

  return (
    filterMapping[filter] || [
      "pending",
      "paid",
      "failed",
      "expired",
      "canceled",
      "fraud",
      "refunded",
    ]
  );
}

export default defineAPI({
  name: "history",
  url: "/api/main/history",
  async handler(arg: HistoryRequest): Promise<ApiResponse<HistoryResponse>> {
    try {
      // Validate user authentication
      if (!arg.user?.id) {
        return {
          success: false,
          message: "User harus login untuk melihat riwayat transaksi",
        };
      }

      const page = arg.page || 1;
      const limit = arg.limit || 10;
      const skip = (page - 1) * limit;
      const filter = arg.filter || "semua";

      if (!arg.user.idCustomer) {
        return {
          success: false,
          message: "Data customer tidak ditemukan",
        };
      }

      // Build where clause
      const where: any = {
        id_customer: arg.user.idCustomer,
        status: { not: "cart" }, // Exclude cart items
        deleted_at: null,
      };

      // Apply status filter
      const statuses = mapFilterToStatus(filter);
      where.status = { in: statuses };

      // Get total count
      const total = await db.t_sales.count({ where });

      // Get transactions with related data
      const transactions = await db.t_sales.findMany({
        where,
        include: {
          t_sales_line: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  cover: true,
                },
              },
              bundle: {
                select: {
                  id: true,
                  name: true,
                  cover: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      });

      // Transform data to match UI requirements
      const historyItems: HistoryItem[] = transactions.map((transaction) => {
        const mainItem = transaction.t_sales_line[0]; // Get first item for main display
        const hasMultipleItems = transaction.t_sales_line.length > 1;

        // Get main item info
        const mainProduct = mainItem?.product || mainItem?.bundle;
        const mainItemName = mainProduct?.name || "Produk Digital";

        // Build title
        let title = mainItemName;
        if (hasMultipleItems) {
          title += ` dan ${transaction.t_sales_line.length - 1} item lainnya`;
        }

        // Get thumbnail
        let thumbnail = "/img/default-product.png";
        if (mainProduct?.cover) {
          try {
            if (
              typeof mainProduct.cover === "string" &&
              mainProduct.cover.startsWith("[")
            ) {
              const imgArray = JSON.parse(mainProduct.cover);
              thumbnail = imgArray[0] || thumbnail;
            } else {
              thumbnail = mainProduct.cover || thumbnail;
            }
          } catch {
            thumbnail = mainProduct.cover || thumbnail;
          }
        }

        // Format date and time
        const createdDate = new Date(transaction.created_at);
        const purchaseDate = createdDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        const purchaseTime = createdDate.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Build items array
        const items = transaction.t_sales_line.map((line) => {
          const product = line.product || line.bundle;
          return {
            name: product?.name || "Produk Digital",
            thumbnail: (() => {
              if (product?.cover) {
                try {
                  if (
                    typeof product.cover === "string" &&
                    product.cover.startsWith("[")
                  ) {
                    const imgArray = JSON.parse(product.cover);
                    return imgArray[0] || "/img/default-product.png";
                  }
                  return product.cover;
                } catch {
                  return product.cover || "/img/default-product.png";
                }
              }
              return "/img/default-product.png";
            })(),
            quantity: line.qty,
            price: Number(line.unit_price),
            type: line.product ? ("product" as const) : ("bundle" as const),
          };
        });

        return {
          id: transaction.id,
          order_id: transaction.midtrans_order_id,
          title,
          thumbnail,
          status: transaction.status,
          status_label: getStatusLabel(transaction.status),
          total_amount: Number(transaction.total),
          currency: transaction.currency,
          purchase_date: purchaseDate,
          purchase_time: purchaseTime,
          formatted_price: formatRupiah(Number(transaction.total)),
          items,
        };
      });

      // Get filter statistics
      const allTransactions = await db.t_sales.findMany({
        where: {
          id_customer: arg.user.idCustomer,
          status: { not: "cart" },
          deleted_at: null,
        },
        select: {
          status: true,
        },
      });

      const statusCounts = allTransactions.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const filter_stats = [
        { key: "semua", label: "Semua", count: allTransactions.length },
        {
          key: "berhasil",
          label: "Berhasil",
          count: statusCounts["paid"] || 0,
        },
        {
          key: "dibatalkan",
          label: "Dibatalkan",
          count: statusCounts["canceled"] || 0,
        },
        {
          key: "menunggu_pembayaran",
          label: "Menunggu Pembayaran",
          count: statusCounts["pending"] || 0,
        },
        {
          key: "kadaluwarsa",
          label: "Kadaluwarsa",
          count: statusCounts["expired"] || 0,
        },
        {
          key: "ditolak",
          label: "Ditolak",
          count: (statusCounts["fraud"] || 0) + (statusCounts["failed"] || 0),
        },
      ];

      return {
        success: true,
        data: {
          transactions: historyItems,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
          filter_stats,
        },
      };
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return {
        success: false,
        message: "Gagal mengambil riwayat transaksi",
      };
    }
  },
});
