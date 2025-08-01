import { baseUrl } from "backend/gen/base-url";
import type { User } from "backend/lib/better-auth";
import type { ApiResponse } from "backend/lib/utils";
import { defineAPI } from "rlib/server";
import {
  createMidtransService,
  createQuickPaymentRequest,
  MIDTRANS_SANDBOX_CONFIG,
  MidtransService,
  type ItemDetails,
} from "../../lib/midtrans";
import t_sales from "./t_sales";

interface CreatePaymentRequest {
  user: Partial<User>;
  cart_items: Array<{
    id: string;
    type: "product" | "bundle";
    quantity: number;
  }>;
  customer_info?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

interface CreatePaymentResponse {
  success: boolean;
  data?: {
    snap_token: string;
    redirect_url: string;
    order_id: string;
    sales_id: string;
    total_amount: number;
    client_key: string;
    snap_js_url: string;
  };
  message?: string;
}

export default defineAPI({
  name: "create_payment",
  url: "/api/main/payment/create",
  async handler(
    arg: CreatePaymentRequest
  ): Promise<ApiResponse<CreatePaymentResponse["data"]>> {
    try {
      // Validasi user login
      if (!arg.user?.id)
        return {
          success: false,
          message: "Pengguna harus login untuk melakukan pembayaran",
        };

      // Validasi cart items
      if (!arg.cart_items || arg.cart_items.length === 0)
        return { success: false, message: "Keranjang belanja kosong" };

      // Get customer data
      const customer = await db.customer.findFirst({
        where: { auth_user: { id: arg.user.id } },
      });

      if (!customer)
        return { success: false, message: "Data pelanggan tidak ditemukan" };

      // Get user data
      const authUser = await db.auth_user.findUnique({
        where: { id: arg.user.id },
      });

      // Calculate cart total and prepare items
      let totalAmount = 0;
      const itemDetails: ItemDetails[] = [];
      const cartProductIds: string[] = [];
      const cartBundleIds: string[] = [];

      // Separate product and bundle IDs
      for (const item of arg.cart_items) {
        if (item.type === "product") {
          cartProductIds.push(item.id);
        } else if (item.type === "bundle") {
          cartBundleIds.push(item.id);
        }
      }

      // Get product details
      if (cartProductIds.length > 0) {
        const products = await db.product.findMany({
          where: {
            id: { in: cartProductIds },
            deleted_at: null,
          },
          select: {
            id: true,
            name: true,
            real_price: true,
            strike_price: true,
          },
        });

        for (const product of products) {
          const cartItem = arg.cart_items.find(
            (item) => item.id === product.id
          );
          if (cartItem) {
            const price = Number(product.real_price);
            const itemTotal = price * cartItem.quantity;
            totalAmount += itemTotal;

            itemDetails.push({
              id: product.id,
              name: product.name,
              price: price,
              quantity: cartItem.quantity,
              category: "Product",
            });
          }
        }
      }

      // Get bundle details
      if (cartBundleIds.length > 0) {
        const bundles = await db.bundle.findMany({
          where: {
            id: { in: cartBundleIds },
            deleted_at: null,
          },
          select: {
            id: true,
            name: true,
            real_price: true,
            strike_price: true,
          },
        });

        for (const bundle of bundles) {
          const cartItem = arg.cart_items.find((item) => item.id === bundle.id);
          if (cartItem) {
            const price = Number(bundle.real_price);
            const itemTotal = price * cartItem.quantity;
            totalAmount += itemTotal;

            itemDetails.push({
              id: bundle.id,
              name: bundle.name,
              price: price,
              quantity: cartItem.quantity,
              category: "Bundle",
            });
          }
        }
      }

      if (totalAmount <= 0) {
        return {
          success: false,
          message: "Total pembayaran tidak valid",
        };
      }

      // Generate unique order ID
      const orderId = MidtransService.generateOrderId("ESENSI");

      // Initialize Midtrans service
      const midtrans = createMidtransService({
        ...MIDTRANS_SANDBOX_CONFIG, // Change to MIDTRANS_PRODUCTION_CONFIG for production
        serverKey: process.env.MIDTRANS_SERVER_KEY!,
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      });

      // Prepare customer details
      const customerDetails = {
        first_name:
          arg.customer_info?.first_name ||
          authUser?.name?.split(" ")[0] ||
          customer.name.split(" ")[0] ||
          "Customer",
        last_name:
          arg.customer_info?.last_name ||
          authUser?.name?.split(" ").slice(1).join(" ") ||
          customer.name.split(" ").slice(1).join(" ") ||
          "",
        email:
          arg.customer_info?.email || authUser?.email || customer.email || "",
        phone: arg.customer_info?.phone
          ? MidtransService.formatPhoneNumber(arg.customer_info.phone)
          : customer.whatsapp || "",
      };

      // Create payment request
      const paymentRequest = createQuickPaymentRequest(
        orderId,
        totalAmount,
        customerDetails,
        itemDetails.map((x) => ({ ...x, name: x.name.substring(0, 10) }))
      );

      // Add callbacks and expiry
      paymentRequest.callbacks = {
        finish: `${baseUrl.main_esensi}/payment/success`,
        unfinish: `${baseUrl.main_esensi}/payment/pending`,
        error: `${baseUrl.main_esensi}/payment/error`,
      };

      paymentRequest.expiry = {
        unit: "minute",
        duration: 60, // 1 hour expiry
      };

      // Validate request
      const validationErrors =
        MidtransService.validateTransactionRequest(paymentRequest);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: `Validation error: ${validationErrors.join(", ")}`,
        };
      }

      // Create SNAP token
      const snapResponse = await midtrans.createTransaction(paymentRequest);
      let newSalesRecordId: string | null = null;
      // Create order record in database
      await db.$transaction(async (tx) => {
        // Create t_sales record
        const salesRecord = await tx.t_sales.create({
          data: {
            id_customer: customer.id,
            status: "pending",
            total: totalAmount,
            currency: "Rp.",
            midtrans_order_id: orderId,
            info: {
              customer_details: customerDetails,
              payment_request_summary: {
                order_id: orderId,
                gross_amount: totalAmount,
                item_count: itemDetails.length,
              },
              snap_token: snapResponse.token,
            } as any,
          },
        });

        newSalesRecordId = salesRecord.id;

        // Create t_sales_line records
        for (const item of itemDetails) {
          const originalCartItem = arg.cart_items.find(
            (ci) => ci.id === item.id
          );
          await tx.t_sales_line.create({
            data: {
              id_sales: salesRecord.id,
              unit_price: item.price,
              qty: item.quantity,
              total_price: item.price * item.quantity,
              id_product: item.category === "Product" ? item.id : null,
              id_bundle: item.category === "Bundle" ? item.id : null,
              data: {
                ...item,
                original_cart_item: originalCartItem,
              }, // Save the complete item data
            },
          });
        }
      });
      // Get Snap configuration for frontend
      const snapConfig = midtrans.getSnapConfig();

      return {
        success: true,
        data: {
          snap_token: snapResponse.token,
          redirect_url: snapResponse.redirect_url,
          order_id: orderId,
          sales_id: newSalesRecordId!,
          total_amount: totalAmount,
          client_key: snapConfig.clientKey,
          snap_js_url: snapConfig.snapJs,
        },
      };
    } catch (error) {
      console.error("Error creating payment:", error);
      return {
        success: false,
        message: "Gagal membuat pembayaran. Silakan coba lagi.",
      };
    }
  },
});
