import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import type { JsonArray } from "shared/models/runtime/library";

export default defineAPI({
  name: "trx",
  url: "/trx/:id",
  async handler() {
    const req = this.req!;

    // Get current user session
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    if (!user) {
      return {
        success: false,
        message: "User harus login untuk melihat detail transaksi",
      };
    }

    if (!user.idCustomer) {
      return {
        success: false,
        message: "Data customer tidak ditemukan",
      };
    }

    // Get current user ID from BetterAuth session
    const trx_id = req.params?.id ? req.params.id : undefined;

    const trx = await db.t_sales.findFirst({
      where: {
        id_customer: user.idCustomer,
        id: trx_id,
        deleted_at: null,
      },
      include: {
        t_sales_line: {
          include: {
            product: true,
            bundle: true,
          },
        },
        customer: true,
      },
    });

    let subtotal = 0;
    let discount = 0;

    const items = trx?.t_sales_line?.map((item: any, idx) => {
      // Return formatted item data
      const item_data = {
        name: item.product?.name || item.bundle?.name || "eBook",
        thumbnail: (() => {
          let imgFile = item.product?.cover || item.bundle?.cover;
          if (imgFile) {
            try {
              // Try to parse as JSON array if it's a string
              if (typeof imgFile === "string" && imgFile.startsWith("[")) {
                const imgArray = JSON.parse(imgFile);
                return imgArray[0] || "/img/default-product.png";
              }
              return imgFile;
            } catch {
              return imgFile || "/img/default-product.png";
            }
          } else {
            return "/img/default-product.png";
          }
        })(),
        currency: item.product?.currency || item.bundle?.currency || "Rp.",
        qty: item.qty,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        type: item.product ? "product" : "bundle",
      };
      return item_data;
    });

    // Format date and time
    const createdDate = trx !== null ? new Date(trx.created_at) : null;
    const purchaseDate =
      createdDate !== null &&
      createdDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    const purchaseTime =
      createdDate !== null &&
      createdDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

    // Get payment details from Midtrans columns
    const payment_details = (() => {
      try {
        // JSONB columns are already objects, no need to parse
        if (trx?.midtrans_success && trx.midtrans_success !== null) {
          return {
            status: "success",
            data: trx.midtrans_success,
          };
        } else if (trx?.midtrans_pending && trx.midtrans_pending !== null) {
          return {
            status: "pending",
            data: trx.midtrans_pending,
          };
        } else if (trx?.midtrans_error && trx.midtrans_error !== null) {
          return {
            status: "error",
            data: trx.midtrans_error,
          };
        }
        return null;
      } catch (error) {
        console.error("Error getting payment details:", error);
        return null;
      }
    })() as any;

    const receiptData = trx
      ? {
          transaction_id: trx.midtrans_order_id || `#${trx.id}`,
          date: purchaseDate,
          time: purchaseTime,
          store_name: "Esensi Online",
          store_address: "esensi.online || info@esensi.online",
          customer_name: trx.customer?.name || "Customer Esensi",
          customer_email: trx.customer?.email || "customer@esensi.online",
          items: items || [],
          subtotal: Number(trx.total),
          tax: 0, // Add tax calculation if needed
          total: Number(trx.total),
          payment_details: payment_details,
          status:
            trx.status,
          currency: trx.currency || "Rp.",
        }
      : null;

    const data = {
      title: `Detail Pembelian Ebook Anda`,
      receiptData: receiptData,
      breadcrumb: [
        {
          url: "/history",
          label: `Semua Transaksi`,
        },
        {
          url: null,
          label: receiptData?.transaction_id || "Detail Transaksi",
        },
      ],
    };

    return {
      jsx: <></>,
      data: data,
    };
  },
});
