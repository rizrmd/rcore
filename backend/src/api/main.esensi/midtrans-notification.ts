import { createMidtransService } from "backend/lib/midtrans";
import { defineAPI } from "rlib/server";

interface MidtransNotificationResponse {
  status: string;
  message: string;
}

export default defineAPI({
  name: "midtrans_notification",
  url: "/api/main/midtrans/notification",
  async handler(): Promise<MidtransNotificationResponse> {
    const req = this.req!;

    try {
      // Initialize Midtrans service
      const midtrans = createMidtransService({
        isProduction: process.env.NODE_ENV === "production",
        serverKey: process.env.MIDTRANS_SERVER_KEY || "",
        clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
      });

      // Get notification data from request body
      const body = await req.text();
      const notification = JSON.parse(body);

      // Verify signature
      if (!midtrans.verifyNotificationSignature(notification)) {
        console.error("Invalid Midtrans notification signature");
        return {
          status: "error",
          message: "Invalid signature",
        };
      }

      const order_id = notification.order_id;
      const transaction_status = notification.transaction_status;
      const fraud_status = notification.fraud_status;

      console.log(
        `Midtrans notification received for order: ${order_id}, status: ${transaction_status}`
      );

      // Find transaction in database
      const transaction = await db.t_sales.findFirst({
        where: {
          midtrans_order_id: order_id,
        },
      });

      if (!transaction) {
        console.error(`Transaction not found for order_id: ${order_id}`);
        return {
          status: "error",
          message: "Transaction not found",
        };
      }

      // Update transaction based on status
      let update_data: any = {};

      if (transaction_status === "capture") {
        if (fraud_status === "challenge") {
          // Fraud challenge, need manual review
          update_data = {
            status: "challenge",
            midtrans_pending: notification,
          };
        } else if (fraud_status === "accept") {
          // Payment successful
          update_data = {
            status: "success",
            midtrans_success: notification,
          };

          // Grant access to purchased items
          await grantAccessToItems(
            transaction.id_customer,
            transaction.info as any
          );
        }
      } else if (transaction_status === "settlement") {
        // Payment completed successfully
        update_data = {
          status: "success",
          midtrans_success: notification,
        };

        // Grant access to purchased items
        await grantAccessToItems(
          transaction.id_customer,
          transaction.info as any
        );
      } else if (transaction_status === "pending") {
        // Payment is pending (e.g., bank transfer)
        update_data = {
          status: "pending",
          midtrans_pending: notification,
        };
      } else if (transaction_status === "deny") {
        // Payment denied
        update_data = {
          status: "failed",
          midtrans_error: notification,
        };
      } else if (
        transaction_status === "cancel" ||
        transaction_status === "expire"
      ) {
        // Payment cancelled or expired
        update_data = {
          status: "cancelled",
          midtrans_error: notification,
        };
      } else if (transaction_status === "failure") {
        // Payment failed
        update_data = {
          status: "failed",
          midtrans_error: notification,
        };
      }

      // Update transaction in database
      await db.t_sales.update({
        where: { id: transaction.id },
        data: update_data,
      });

      console.log(
        `Transaction ${order_id} updated with status: ${update_data.status}`
      );

      return {
        status: "success",
        message: "Notification processed",
      };
    } catch (error) {
      console.error("Error processing Midtrans notification:", error);
      return {
        status: "error",
        message: "Internal server error",
      };
    }
  },
});

// Helper function to grant access to purchased items
async function grantAccessToItems(customer_id: string, transaction_info: any) {
  try {
    const cart_items = transaction_info?.cart || [];

    for (const item of cart_items) {
      if (item.type === "product") {
        // Check if user already has access
        const existing_access = await db.t_sales_download.findFirst({
          where: {
            id_customer: customer_id,
            id_product: item.id,
          },
        });

        if (!existing_access) {
          await db.t_sales_download.create({
            data: {
              id_customer: customer_id,
              id_product: item.id,
              download_key: `key_${Date.now()}_${Math.random()
                .toString(36)
                .substring(7)}`,
            },
          });
        }
      } else if (item.type === "bundle") {
        // Grant access to all products in the bundle
        const bundle_products = await db.bundle_product.findMany({
          where: { id_bundle: item.id },
          select: { id_product: true },
        });

        for (const bundle_product of bundle_products) {
          const existing_product_access = await db.t_sales_download.findFirst({
            where: {
              id_customer: customer_id,
              id_product: bundle_product.id_product,
            },
          });

          if (!existing_product_access) {
            await db.t_sales_download.create({
              data: {
                id_customer: customer_id,
                id_product: bundle_product.id_product,
                download_key: `key_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(7)}`,
              },
            });
          }
        }
      }
    }

    console.log(
      `Access granted to customer ${customer_id} for ${cart_items.length} items`
    );
  } catch (error) {
    console.error("Error granting access to items:", error);
    throw error;
  }
}
