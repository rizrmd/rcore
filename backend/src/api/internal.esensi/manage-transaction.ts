import type { ManageTransactionRequest } from "shared/types";
import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";
import {
  createMidtransService,
  MIDTRANS_SANDBOX_CONFIG,
  type TransactionStatusResponse,
} from "../../lib/midtrans";

export default defineAPI({
  name: "manage_transaction",
  url: "/api/payment/manage",
  async handler(
    arg: ManageTransactionRequest
  ): Promise<ApiResponse<TransactionStatusResponse>> {
    try {
      // Check if user is admin/internal
      if (!arg.user?.id)
        return { success: false, message: "Authentication required" };

      // Check user permissions (internal user or admin)
      const internal = await db.internal.findFirst({
        where: { auth_user: { id: arg.user.id } },
      });

      if (!internal)
        return {
          success: false,
          message: "Akses ditolak. Hanya admin yang dapat mengelola transaksi.",
        };

      if (!arg.order_id)
        return { success: false, message: "Order ID diperlukan" };

      // Initialize Midtrans service
      const midtrans = createMidtransService({
        ...MIDTRANS_SANDBOX_CONFIG, // Change to MIDTRANS_PRODUCTION_CONFIG for production
        serverKey: process.env.MIDTRANS_SERVER_KEY!,
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      });

      let result: TransactionStatusResponse;

      // Perform the requested action
      switch (arg.action) {
        case "approve":
          result = await midtrans.approveTransaction(arg.order_id);
          break;

        case "deny":
          result = await midtrans.denyTransaction(arg.order_id);
          break;

        case "cancel":
          result = await midtrans.cancelTransaction(arg.order_id);
          break;

        case "expire":
          result = await midtrans.expireTransaction(arg.order_id);
          break;

        case "refund":
          if (!arg.refund_amount) {
            return {
              success: false,
              message: "Refund amount diperlukan untuk refund",
            };
          }
          result = await midtrans.refundTransaction(
            arg.order_id,
            arg.refund_amount,
            arg.refund_reason || "Manual refund by admin"
          );
          break;

        case "status":
          result = await midtrans.getTransactionStatus(arg.order_id);
          break;

        default:
          return { success: false, message: "Action tidak valid" };
      }

      // Update local database if needed
      if (arg.action !== "status") {
        const salesRecord = await db.t_sales.findFirst({
          where: { midtrans_order_id: arg.order_id },
        });

        if (salesRecord) {
          await db.t_sales.update({
            where: { id: salesRecord.id },
            data: {
              status: result.transaction_status,
              updated_at: new Date(),
              ...(arg.action === "approve" && {
                midtrans_success: result as any,
              }),
              ...(["deny", "cancel", "expire"].includes(arg.action) && {
                midtrans_error: result as any,
              }),
            },
          });
        }
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`Error ${arg.action} transaction:`, error);
      return {
        success: false,
        message: `Gagal ${arg.action} transaksi: ${error}`,
      };
    }
  },
});
