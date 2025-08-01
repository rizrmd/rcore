import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "midtrx_get",
  url: "/api/internal/midtrx/get",
  async handler(arg: { id: string }) {
    try {
      if (!arg.id)
        return { success: false, message: "ID transaksi Midtrans harus diisi" };

      const record = await db.midtrx.findUnique({
        where: { id: arg.id },
      });

      if (!record)
        return {
          success: false,
          message: "Data transaksi Midtrans tidak ditemukan",
        };

      // Try to find related sales record if available
      let salesRecord = null;
      const orderId = (record.payload as any)?.order_id;

      if (orderId) {
        salesRecord = await db.t_sales.findFirst({
          where: {
            midtrans_order_id: orderId,
          },
          include: {
            customer: true,
            t_sales_line: {
              include: {
                product: true,
                bundle: true,
              },
            },
          },
        });
      }

      return {
        success: true,
        data: {
          id: record.id,
          type: record.type,
          timestamp: record.tz,
          payload: record.payload,
          sales_record: salesRecord
            ? {
                id: salesRecord.id,
                status: salesRecord.status,
                total: salesRecord.total,
                customer: {
                  id: salesRecord.customer.id,
                  name: salesRecord.customer.name,
                  email: salesRecord.customer.email,
                },
                items: salesRecord.t_sales_line.map((line) => ({
                  id: line.id,
                  product: line.product
                    ? {
                        id: line.product.id,
                        name: line.product.name,
                        price: line.unit_price,
                      }
                    : null,
                  bundle: line.bundle
                    ? {
                        id: line.bundle.id,
                        name: line.bundle.name,
                        price: line.unit_price,
                      }
                    : null,
                  qty: line.qty,
                  total_price: line.total_price,
                })),
              }
            : null,
        },
      };
    } catch (error) {
      console.error("Error fetching midtrx record detail:", error);
      return {
        success: false,
        message: "Gagal mengambil detail transaksi Midtrans",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
