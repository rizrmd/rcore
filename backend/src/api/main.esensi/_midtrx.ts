import type { ApiResponse } from "backend/src/lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "_midtrx",
  url: "/_midtrx",
  async handler(arg: {
    order_id: string;
    status: string;
    gross_amount?: number;
  }): Promise<ApiResponse<{ order_id: string }>> {
    const { order_id, gross_amount, status } = arg;
    const req = this.req!;

    try {
      if (status === "success") {
        // Find the transaction in the database
        const transaction = await db.t_sales.findFirst({
          where: {
            midtrans_order_id: order_id,
          },
        });

        if (!transaction) {
          return {
            success: false,
            message: "Transaction not found",
          };
        }

        // Update transaction status if not already successful
        if (transaction.status !== "paid") {
          await db.t_sales.update({
            where: { id: transaction.id },
            data: {
              status: "paid",
              midtrans_order_id: order_id,
              midtrans_success: {
                order_id: order_id,
                gross_amount: gross_amount,
                timestamp: new Date().toISOString(),
              },
              midtrans_pending: undefined,
              midtrans_error: undefined,
            },
          });
        }

        // Grant access to purchased items (add to user library)
        await grantAccessToItems(
          transaction.id_customer,
          transaction.info as any
        );

        return {
          success: true,
          message: "Payment processed successfully",
          data: { order_id: arg.order_id },
        };
      }

      return {
        success: false,
        message: "Invalid payment status",
      };
    } catch (error: any) {
      console.error("Error processing payment callback:", error);
      return {
        success: false,
        message:
          error?.message || "Terjadi kesalahan dalam memproses pembayaran",
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
        // Check if user already has access to the product
        const existing_access = await db.t_sales_download.findFirst({
          where: {
            id_customer: customer_id,
            id_product: item.id,
          },
        });

        if (!existing_access) {
          // Add product to user's library
          await db.t_sales_download.create({
            data: {
              id_customer: customer_id,
              id_product: item.id,
              download_key: `key_${Date.now()}_${Math.random()
                .toString(36)
                .substring(7)}`,
            },
          });

          // Also add to customer_reader table for library display
          const existing_reader = await db.customer_reader.findFirst({
            where: {
              id_customer: customer_id,
              id_product: item.id,
            },
          });

          if (!existing_reader) {
            await db.customer_reader.create({
              data: {
                id_customer: customer_id,
                id_product: item.id,
                last_page: 0,
                percent: 0,
              },
            });
          }
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
            // Add product to user's library
            await db.t_sales_download.create({
              data: {
                id_customer: customer_id,
                id_product: bundle_product.id_product,
                download_key: `key_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(7)}`,
              },
            });

            // Also add to customer_reader table for library display
            const existing_reader = await db.customer_reader.findFirst({
              where: {
                id_customer: customer_id,
                id_product: bundle_product.id_product,
              },
            });

            if (!existing_reader) {
              await db.customer_reader.create({
                data: {
                  id_customer: customer_id,
                  id_product: bundle_product.id_product,
                  last_page: 0,
                  percent: 0,
                },
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error granting access to items:", error);
    throw error;
  }
}
