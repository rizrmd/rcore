import { createMidtransService } from "backend/lib/midtrans";
import { defineAPI } from "rlib/server";

interface CheckPaymentStatusResponse {
  success: boolean;
  data?: {
    order_id: string;
    transaction_id: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: Date;
    updated_at: Date | null;
    items: any[];
    customer: any;
    payment_info: any;
  };
  message?: string;
}

export default defineAPI({
  name: "check_payment_status",
  url: "/api/main/payment/status",
  async handler(arg: {
    order_id: string;
  }): Promise<CheckPaymentStatusResponse> {
    if (!arg.order_id)
      return { success: false, message: "Order ID diperlukan" };

    try {
      // Find transaction in database
      const transaction = await db.t_sales.findFirst({
        where: { midtrans_order_id: arg.order_id },
        select: {
          id: true,
          status: true,
          total: true,
          currency: true,
          midtrans_order_id: true,
          midtrans_success: true,
          midtrans_pending: true,
          midtrans_error: true,
          info: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!transaction)
        return { success: false, message: "Transaksi tidak ditemukan" };

      // Initialize Midtrans service
      const midtrans = createMidtransService({
        isProduction: process.env.NODE_ENV === "production",
        serverKey: process.env.MIDTRANS_SERVER_KEY || "",
        clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
      });

      // Get latest status from Midtrans
      let midtrans_status = null;
      try {
        midtrans_status = await midtrans.getTransactionStatus(arg.order_id);
      } catch (error) {
        console.log("Failed to get Midtrans status:", error);
        // Continue with database status if Midtrans is unavailable
      }

      // Prepare response data
      const response_data = {
        order_id: transaction.midtrans_order_id,
        transaction_id: transaction.id,
        status: transaction.status,
        total_amount:
          typeof transaction.total === "object"
            ? transaction.total.toNumber()
            : transaction.total,
        currency: transaction.currency,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
        items: (transaction.info as any)?.cart || [],
        customer: (transaction.info as any)?.customer || {},
        payment_info: null as any,
      };

      // Add payment info based on status
      if (transaction.midtrans_success) {
        response_data.payment_info = {
          status: "success",
          payment_type: (transaction.midtrans_success as any).payment_type,
          transaction_time: (transaction.midtrans_success as any)
            .transaction_time,
          va_numbers: (transaction.midtrans_success as any).va_numbers,
          fraud_status: (transaction.midtrans_success as any).fraud_status,
        };
      } else if (transaction.midtrans_pending) {
        response_data.payment_info = {
          status: "pending",
          payment_type: (transaction.midtrans_pending as any).payment_type,
          transaction_time: (transaction.midtrans_pending as any)
            .transaction_time,
          va_numbers: (transaction.midtrans_pending as any).va_numbers,
        };
      } else if (transaction.midtrans_error) {
        response_data.payment_info = {
          status: "error",
          payment_type: (transaction.midtrans_error as any).payment_type,
          transaction_time: (transaction.midtrans_error as any)
            .transaction_time,
        };
      }

      // If we got fresh data from Midtrans, include it
      if (midtrans_status) {
        response_data.payment_info = {
          status: midtrans_status.transaction_status,
          payment_type: midtrans_status.payment_type,
          transaction_time: midtrans_status.transaction_time,
          va_numbers: midtrans_status.va_numbers,
          fraud_status: midtrans_status.fraud_status,
        };
      }

      return { success: true, data: response_data };
    } catch (error: any) {
      return { success: false, message: error?.message || "Terjadi kesalahan" };
    }
  },
});
