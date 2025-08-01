import { defineAPI } from "rlib/server";
import {
  createMidtransService,
  FRAUD_STATUS,
  MIDTRANS_SANDBOX_CONFIG,
  PAYMENT_STATUS,
  type NotificationPayload,
  type TransactionStatusResponse,
} from "../../lib/midtrans";

interface PaymentWebhookResponse {
  success: boolean;
  message: string;
}

export default defineAPI({
  name: "payment_webhook",
  url: "/api/main/payment/webhook",
  async handler(
    notification: NotificationPayload
  ): Promise<PaymentWebhookResponse> {
     const orderIdForLog = notification.order_id || "UNKNOWN_ORDER";
    console.log(`[${orderIdForLog}] --- Webhook handler started ---`);
    try {
      const midtrxRecord = await db.midtrx.create({
        data: {
          type: "webhook_notification",
          payload: notification as any,
        },
      });

      // Initialize Midtrans service
      const midtrans = createMidtransService({
        ...MIDTRANS_SANDBOX_CONFIG, // Change to MIDTRANS_PRODUCTION_CONFIG for production
        serverKey: process.env.MIDTRANS_SERVER_KEY!,
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      });

      // Verify notification signature
      const isValidSignature =
        midtrans.verifyNotificationSignature(notification);

      if (!isValidSignature) {
        console.error("Invalid signature from Midtrans notification");
        // Update midtrx record with error status
        await db.midtrx.update({
          where: { id: midtrxRecord.id },
          data: {
            payload: {
              ...notification,
              processing_error: "Invalid signature",
              processing_status: "rejected",
            } as any,
          },
        });
        return { success: false, message: "Invalid signature" };
      }

      // Get latest transaction status from Midtrans
      const transactionStatus = await midtrans.getTransactionStatus(
        notification.order_id
      );

      // Find the sales record
      const salesRecord = await db.t_sales.findFirst({
        where: {
          midtrans_order_id: notification.order_id,
        },
        include: {
          t_sales_line: {
            include: {
              product: true,
              bundle: {
                include: {
                  bundle_product: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
            },
          },
          customer: true,
        },
      });

      if (!salesRecord) {
        console.error(
          "Sales record not found for order_id:",
          notification.order_id
        );
        // Update midtrx record with error status
        await db.midtrx.update({
          where: { id: midtrxRecord.id },
          data: {
            payload: {
              ...notification,
              transaction_status_response: transactionStatus,
              processing_error: "Order not found",
              processing_status: "rejected",
            } as any,
          },
        });
        return { success: false, message: "Order not found" };
      }

      // Process payment based on status
      await handlePaymentStatus(transactionStatus, salesRecord, midtrans);

      // Update midtrx record with successful processing
      await db.midtrx.update({
        where: { id: midtrxRecord.id },
        data: {
          payload: {
            ...notification,
            transaction_status_response: transactionStatus,
            processing_status: "processed",
            processing_timestamp: new Date().toISOString(),
            sales_record_id: salesRecord.id,
          } as any,
        },
      });

      return { success: true, message: "Notification processed successfully" };
    } catch (error) {
      console.error("Error processing Midtrans notification:", error);
      // Try to store error in midtrx if possible
      try {
        await db.midtrx.create({
          data: {
            type: "webhook_notification_error",
            payload: {
              original_notification: notification,
              error_message:
                error instanceof Error ? error.message : "Unknown error",
              error_stack: error instanceof Error ? error.stack : undefined,
              processing_status: "error",
              processing_timestamp: new Date().toISOString(),
            } as any,
          },
        });
      } catch (dbError) {
        console.error("Failed to store error in midtrx table:", dbError);
      }
      return { success: false, message: "Internal server error" };
    }
  },
});

async function handlePaymentStatus(
  status: TransactionStatusResponse,
  salesRecord: any,
  midtrans: any
) {
  const orderId = status.order_id;
  const transactionStatus = status.transaction_status;
  const fraudStatus = status.fraud_status;
  console.log(`[${orderId}] Routing payment status: '${transactionStatus}', fraud status: '${fraudStatus}'`);

  switch (transactionStatus) {
    case PAYMENT_STATUS.CAPTURE:
      if (fraudStatus === FRAUD_STATUS.ACCEPT) {
        await handleSuccessfulPayment(salesRecord, status);
      } else if (fraudStatus === FRAUD_STATUS.CHALLENGE) {
        await handleChallengePayment(salesRecord, status);
      } else if (fraudStatus === FRAUD_STATUS.DENY) {
        await handleFailedPayment(salesRecord, status);
      }
      break;

    case PAYMENT_STATUS.SETTLEMENT:
      await handleSuccessfulPayment(salesRecord, status);
      break;

    case PAYMENT_STATUS.PENDING:
      await handlePendingPayment(salesRecord, status);
      break;

    case PAYMENT_STATUS.DENY:
    case PAYMENT_STATUS.FAILURE:
      await handleFailedPayment(salesRecord, status);
      break;

    case PAYMENT_STATUS.CANCEL:
    case PAYMENT_STATUS.EXPIRE:
      await handleExpiredPayment(salesRecord, status);
      break;

    default:
      console.warn(`Unknown transaction status: ${transactionStatus}`);
      break;
  }
}

async function handleSuccessfulPayment(
  salesRecord: any,
  status: TransactionStatusResponse
) {
  await db.$transaction(async (tx) => {
    // Collect information about products that will be added to library
    const libraryUpdates: any[] = [];

    for (const salesLine of salesRecord.t_sales_line) {
      if (salesLine.product) {
        libraryUpdates.push({
          product_id: salesLine.product.id,
          product_name: salesLine.product.name,
          product_type: salesLine.product.type || "ebook",
          price: salesLine.unit_price,
          qty: salesLine.qty,
        });
      } else if (salesLine.bundle) {
        // For bundles, add all products in the bundle
        for (const bundleProduct of salesLine.bundle.bundle_product) {
          libraryUpdates.push({
            product_id: bundleProduct.product.id,
            product_name: bundleProduct.product.name,
            product_type: bundleProduct.product.content_type || "ebook",
            price: salesLine.unit_price, // Bundle price divided by products would be complex
            qty: salesLine.qty,
            from_bundle: salesLine.bundle.name,
          });
        }
      }
    }

    // Store successful payment data in midtrx table
    await tx.midtrx.create({
      data: {
        type: "payment_success",
        payload: {
          transaction_status: status,
          sales_record_id: salesRecord.id,
          customer_id: salesRecord.customer.id,
          order_id: status.order_id,
          transaction_id: status.transaction_id,
          gross_amount: status.gross_amount,
          payment_type: status.payment_type,
          currency: status.currency,
          transaction_time: status.transaction_time,
          processing_timestamp: new Date().toISOString(),
          products_granted: libraryUpdates,
          library_summary: {
            total_ebooks_added: libraryUpdates.length,
            customer_can_read_online: true,
            ebooks_list: libraryUpdates.map((item) => ({
              name: item.product_name,
              content_type: item.product_type,
              from_bundle: item.from_bundle || null,
            })),
          },
        } as any,
      },
    });

    // Update sales status to paid
    await tx.t_sales.update({
      where: { id: salesRecord.id },
      data: {
        status: "paid",
        midtrans_success: status as any,
        updated_at: new Date(),
      },
    });

    // Grant access to purchased products
    for (const salesLine of salesRecord.t_sales_line) {
      if (salesLine.product) {
        // Direct product purchase - grant access
        await grantProductAccess(
          tx,
          salesRecord.customer.id,
          salesLine.product
        );
      } else if (salesLine.bundle) {
        // Bundle purchase - grant access to all products in bundle
        for (const bundleProduct of salesLine.bundle.bundle_product) {
          await grantProductAccess(
            tx,
            salesRecord.customer.id,
            bundleProduct.product
          );
        }
      }
    }

    // Create revenue transaction for publisher(s)
    await createRevenueTransactions(tx, salesRecord, status);
  });

  await updateShipmentStatus(salesRecord)

  // Send success notification (email, etc.)
  await sendPaymentSuccessNotification(salesRecord, status);
}

async function handlePendingPayment(
  salesRecord: any,
  status: TransactionStatusResponse
) {
  await db.$transaction(async (tx) => {
    // Store pending payment data in midtrx table
    await tx.midtrx.create({
      data: {
        type: "payment_pending",
        payload: {
          transaction_status: status,
          sales_record_id: salesRecord.id,
          customer_id: salesRecord.customer.id,
          order_id: status.order_id,
          transaction_id: status.transaction_id,
          gross_amount: status.gross_amount,
          payment_type: status.payment_type,
          currency: status.currency,
          transaction_time: status.transaction_time,
          processing_timestamp: new Date().toISOString(),
        } as any,
      },
    });

    await tx.t_sales.update({
      where: { id: salesRecord.id },
      data: {
        status: "pending",
        midtrans_pending: status as any,
        updated_at: new Date(),
      },
    });
  });

  // Send pending payment instructions
  await sendPendingPaymentNotification(salesRecord, status);
}

async function handleFailedPayment(
  salesRecord: any,
  status: TransactionStatusResponse
) {
  await db.$transaction(async (tx) => {
    // Store failed payment data in midtrx table
    await tx.midtrx.create({
      data: {
        type: "payment_failed",
        payload: {
          transaction_status: status,
          sales_record_id: salesRecord.id,
          customer_id: salesRecord.customer.id,
          order_id: status.order_id,
          transaction_id: status.transaction_id,
          gross_amount: status.gross_amount,
          payment_type: status.payment_type,
          currency: status.currency,
          transaction_time: status.transaction_time,
          processing_timestamp: new Date().toISOString(),
          failure_reason: status.status_message,
        } as any,
      },
    });

    await tx.t_sales.update({
      where: { id: salesRecord.id },
      data: {
        status: "failed",
        midtrans_error: status as any,
        updated_at: new Date(),
      },
    });
  });

  // Send failure notification
  await sendPaymentFailureNotification(salesRecord, status);
}

async function handleExpiredPayment(
  salesRecord: any,
  status: TransactionStatusResponse
) {
  await db.$transaction(async (tx) => {
    // Store expired payment data in midtrx table
    await tx.midtrx.create({
      data: {
        type: "payment_expired",
        payload: {
          transaction_status: status,
          sales_record_id: salesRecord.id,
          customer_id: salesRecord.customer.id,
          order_id: status.order_id,
          transaction_id: status.transaction_id,
          gross_amount: status.gross_amount,
          payment_type: status.payment_type,
          currency: status.currency,
          transaction_time: status.transaction_time,
          processing_timestamp: new Date().toISOString(),
        } as any,
      },
    });

    await tx.t_sales.update({
      where: { id: salesRecord.id },
      data: {
        status: "expired",
        midtrans_error: status as any,
        updated_at: new Date(),
      },
    });
  });
}

async function handleChallengePayment(
  salesRecord: any,
  status: TransactionStatusResponse
) {
  await db.$transaction(async (tx) => {
    // Store challenge payment data in midtrx table
    await tx.midtrx.create({
      data: {
        type: "payment_challenge",
        payload: {
          transaction_status: status,
          sales_record_id: salesRecord.id,
          customer_id: salesRecord.customer.id,
          order_id: status.order_id,
          transaction_id: status.transaction_id,
          gross_amount: status.gross_amount,
          payment_type: status.payment_type,
          currency: status.currency,
          transaction_time: status.transaction_time,
          processing_timestamp: new Date().toISOString(),
          fraud_status: status.fraud_status,
        } as any,
      },
    });

    await tx.t_sales.update({
      where: { id: salesRecord.id },
      data: {
        status: "challenge",
        midtrans_pending: status as any,
        updated_at: new Date(),
      },
    });
  });

  // You can implement auto-approve logic here based on your business rules
  // For now, we'll leave it for manual review
}

async function grantProductAccess(tx: any, customerId: string, product: any) {
  // Check if customer already has access to this ebook in their library
  const existingAccess = await tx.customer_reader.findFirst({
    where: {
      id_customer: customerId,
      id_product: product.id,
    },
  });

  if (!existingAccess) {
    // Add the ebook to customer's library with reading progress tracking
    await tx.customer_reader.create({
      data: {
        id_customer: customerId,
        id_product: product.id,
        last_page: 0, // Start from page 0
        percent: 0, // 0% read initially
      },
    });

    // Log the library update in midtrx for audit trail
    await tx.midtrx.create({
      data: {
        type: "library_update",
        payload: {
          customer_id: customerId,
          product_id: product.id,
          product_name: product.name,
          product_type: product.content_type || "ebook",
          action: "added_to_library",
          processing_timestamp: new Date().toISOString(),
          reading_progress: {
            last_page: 0,
            percent: 0,
            status: "not_started",
          },
        } as any,
      },
    });
  } else {
    // Update existing record to ensure it's properly tracked
    await tx.customer_reader.update({
      where: { id: existingAccess.id },
      data: {
        // Reset progress if this is a re-purchase (shouldn't happen but just in case)
        last_page: existingAccess.last_page || 0,
        percent: existingAccess.percent || 0,
      },
    });
  }
}

async function createRevenueTransactions(
  tx: any,
  salesRecord: any,
  status: TransactionStatusResponse
) {
  // Get unique publishers from the sale
  const publisherRevenues = new Map<string, number>();

  for (const salesLine of salesRecord.t_sales_line) {
    let publisherId: string | null = null;
    let revenue = Number(salesLine.total_price);

    if (salesLine.product?.id_author) {
      // Get publisher from product author
      const author = await tx.author.findUnique({
        where: { id: salesLine.product.id_author },
        select: { id_publisher: true },
      });
      publisherId = author?.id_publisher;
    } else if (salesLine.bundle?.id_author) {
      // Get publisher from bundle author
      const author = await tx.author.findUnique({
        where: { id: salesLine.bundle.id_author },
        select: { id_publisher: true },
      });
      publisherId = author?.id_publisher;
    }

    if (publisherId) {
      const currentRevenue = publisherRevenues.get(publisherId) || 0;
      publisherRevenues.set(publisherId, currentRevenue + revenue);
    }
  }

  // Create transaction records for each publisher
  for (const [publisherId, revenue] of publisherRevenues) {
    await tx.transaction.create({
      data: {
        id_publisher: publisherId,
        type: "sale",
        amount: revenue,
        info: {
          order_id: status.order_id,
          transaction_id: status.transaction_id,
          payment_type: status.payment_type,
          customer_id: salesRecord.customer.id,
        },
      },
    });
  }
}

async function sendPaymentSuccessNotification(
  salesRecord: any,
  status: TransactionStatusResponse
) {
  // TODO: Implement email notification
  console.log(
    `Payment success notification sent for order: ${status.order_id}`
  );
}

async function sendPendingPaymentNotification(
  salesRecord: any,
  status: TransactionStatusResponse
) {
  // TODO: Implement pending payment instructions
  console.log(
    `Pending payment notification sent for order: ${status.order_id}`
  );
}

async function sendPaymentFailureNotification(
  salesRecord: any,
  status: TransactionStatusResponse
) {
  // TODO: Implement failure notification
  console.log(
    `Payment failure notification sent for order: ${status.order_id}`
  );
}

async function updateShipmentStatus(salesRecord: any) {
  const orderId = salesRecord.midtrans_order_id;
  console.log(`[${orderId}] ==> Executing updateShipmentStatus`);

  const hasPhysicalGoods = salesRecord.t_sales_line.some(
    (line: any) => line.product?.is_physical === true
  );
  console.log(`[${orderId}] Check for physical goods result: ${hasPhysicalGoods}`);

  if (hasPhysicalGoods) {
    console.log(`[${orderId}] Physical goods found. Updating shipment status.`);
    await db.t_shipment.updateMany({
      where: { id_sales: salesRecord.id },
      data: {
        status: "pending",
      },
    });
    console.log(`[${orderId}] Shipment status updated.`);
  } else {
    console.log(`[${orderId}] No physical goods found. Skipping shipment update.`);
  }
}

