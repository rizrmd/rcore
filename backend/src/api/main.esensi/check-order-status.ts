import type { User } from "backend/lib/better-auth";
import type { OrderStatusResponse } from "shared/types";
import type { ApiResponse } from "backend/lib/utils";
import { defineAPI } from "rlib/server";
import {
  createMidtransService,
  MIDTRANS_SANDBOX_CONFIG,
  type TransactionStatusResponse,
} from "../../lib/midtrans";

interface CheckOrderStatusRequest {
  user: Partial<User>;
  order_id: string;
}

export default defineAPI({
  name: "check_order_status",
  url: "/api/main/payment/status",
  async handler(
    arg: CheckOrderStatusRequest
  ): Promise<ApiResponse<OrderStatusResponse>> {
    try {
      // Validasi user login
      if (!arg.user?.id)
        return {
          success: false,
          message: "Pengguna harus login untuk mengecek status pesanan",
        };

      if (!arg.order_id)
        return { success: false, message: "Order ID diperlukan" };

      // Get customer data
      const customer = await db.customer.findFirst({
        where: { auth_user: { id: arg.user.id } },
      });

      if (!customer)
        return { success: false, message: "Data pelanggan tidak ditemukan" };

      // Find sales record
      const salesRecord = await db.t_sales.findFirst({
        where: {
          midtrans_order_id: arg.order_id,
          id_customer: customer.id,
        },
        include: {
          t_sales_line: {
            include: {
              product: { select: { id: true, name: true } },
              bundle: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!salesRecord)
        return { success: false, message: "Order tidak ditemukan" };

      // Get latest status from Midtrans if needed
      let midtransStatus: TransactionStatusResponse | undefined;

      if (
        salesRecord.status === "pending" ||
        salesRecord.status === "challenge"
      ) {
        try {
          const midtrans = createMidtransService({
            ...MIDTRANS_SANDBOX_CONFIG, // Change to MIDTRANS_PRODUCTION_CONFIG for production
            serverKey: process.env.MIDTRANS_SERVER_KEY!,
            clientKey: process.env.MIDTRANS_CLIENT_KEY!,
          });

          midtransStatus = await midtrans.getTransactionStatus(arg.order_id);

          // Update local status if different
          if (midtransStatus.transaction_status !== salesRecord.status) {
            await db.t_sales.update({
              where: { id: salesRecord.id },
              data: {
                status: midtransStatus.transaction_status,
                updated_at: new Date(),
              },
            });
          }
        } catch (error) {
          console.warn("Failed to get Midtrans status:", error);
        }
      }

      // Prepare response
      const items = salesRecord.t_sales_line.map((line) => ({
        name: line.product?.name || line.bundle?.name || "Unknown Item",
        quantity: line.qty,
        price: Number(line.unit_price),
        type: line.product ? ("product" as const) : ("bundle" as const),
      }));

      const paymentInfo: OrderStatusResponse["payment_info"] = {};

      if (midtransStatus) {
        paymentInfo.payment_type = midtransStatus.payment_type;
        paymentInfo.va_numbers = midtransStatus.va_numbers;
        paymentInfo.payment_code = midtransStatus.payment_code;
        paymentInfo.store = midtransStatus.store;
        paymentInfo.pdf_url = midtransStatus.pdf_url;
      }

      const response: OrderStatusResponse = {
        order_id: salesRecord.midtrans_order_id,
        status: midtransStatus?.transaction_status || salesRecord.status,
        total_amount: Number(salesRecord.total),
        currency: salesRecord.currency,
        items,
        payment_info:
          Object.keys(paymentInfo).length > 0 ? paymentInfo : undefined,
        midtrans_status: midtransStatus,
      };

      return { success: true, data: response };
    } catch (error) {
      console.error("Error checking order status:", error);
      return {
        success: false,
        message: "Gagal mengecek status pesanan",
      };
    }
  },
});
