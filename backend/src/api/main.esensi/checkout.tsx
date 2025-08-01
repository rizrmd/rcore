import { SeoTemplate } from "backend/components/SeoTemplate";
import { baseUrl } from "backend/gen/base-url";
import { createMidtransService, MidtransService } from "backend/lib/midtrans";
import type { User } from "better-auth/types";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface CheckoutResponse {
  jsx: ReactElement;
  data: {
    title: string;
    transaction_id: string;
    snap_token: string;
    redirect_url: string;
    total_amount: number;
    currency: string;
    order_id: string;
    items: Array<{
      id: string;
      type: "product" | "bundle";
      name: string;
      price: number;
    }>;
  };
}

export default defineAPI({
  name: "checkout",
  url: "/checkout",
  async handler(arg: {
    user: Partial<User>;
    cart_items: { id: string; type: "product" | "bundle" }[];
    customer_details: {
      first_name: string;
      last_name?: string;
      email: string;
      phone: string;
    };
  }): Promise<CheckoutResponse> {
    const req = this.req!;
    const uid = arg.user.id;

    if (!uid) {
      return {
        jsx: <></>,
        data: {
          title: "Error",
          transaction_id: "",
          snap_token: "",
          redirect_url: "",
          total_amount: 0,
          currency: "IDR",
          order_id: "",
          items: [],
        },
      };
    }

    // Get customer ID from auth user
    const authUser = await db.auth_user.findFirst({
      where: { id: uid },
      select: { id_customer: true },
    });

    if (!authUser || !authUser.id_customer) {
      return {
        jsx: <></>,
        data: {
          title: "Error",
          transaction_id: "",
          snap_token: "",
          redirect_url: "",
          total_amount: 0,
          currency: "IDR",
          order_id: "",
          items: [],
        },
      };
    }

    if (!arg.cart_items || arg.cart_items.length === 0) {
      return {
        jsx: <></>,
        data: {
          title: "Error",
          transaction_id: "",
          snap_token: "",
          redirect_url: "",
          total_amount: 0,
          currency: "IDR",
          order_id: "",
          items: [],
        },
      };
    }

    // Initialize Midtrans service
    const midtrans = createMidtransService({
      isProduction: process.env.NODE_ENV === "production",
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
      clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    });

    // Calculate cart total and get item details
    let total_amount = 0;
    const item_details = [];
    const cart_data = [];

    for (const cart_item of arg.cart_items) {
      if (cart_item.type === "product") {
        const product = await db.product.findFirst({
          where: { id: cart_item.id },
          select: {
            id: true,
            name: true,
            real_price: true,
            currency: true,
          },
        });

        if (product) {
          const price =
            typeof product.real_price === "object"
              ? product.real_price.toNumber()
              : product.real_price;

          total_amount += price;
          item_details.push({
            id: product.id,
            price: Math.round(price),
            quantity: 1,
            name:
              product.name.length > 50
                ? product.name.substring(0, 47) + "..."
                : product.name,
            category: "Digital Product",
          });
          cart_data.push({
            id: product.id,
            type: "product" as const,
            name: product.name,
            price: price,
          });
        }
      } else if (cart_item.type === "bundle") {
        const bundle = await db.bundle.findFirst({
          where: { id: cart_item.id },
          select: {
            id: true,
            name: true,
            real_price: true,
            currency: true,
          },
        });

        if (bundle) {
          const price =
            typeof bundle.real_price === "object"
              ? bundle.real_price.toNumber()
              : bundle.real_price;

          total_amount += price;
          item_details.push({
            id: bundle.id,
            price: Math.round(price),
            quantity: 1,
            name:
              bundle.name.length > 50
                ? bundle.name.substring(0, 47) + "..."
                : bundle.name,
            category: "Bundle",
          });
          cart_data.push({
            id: bundle.id,
            type: "bundle" as const,
            name: bundle.name,
            price: price,
          });
        }
      }
    }

    if (total_amount <= 0) {
      return {
        jsx: <></>,
        data: {
          title: "Error",
          transaction_id: "",
          snap_token: "",
          redirect_url: "",
          total_amount: 0,
          currency: "IDR",
          order_id: "",
          items: [],
        },
      };
    }

    // Generate unique order ID
    const order_id = MidtransService.generateOrderId("ESENSI");

    // Create transaction record in database
    const transaction = await db.t_sales.create({
      data: {
        // id: order_id,
        id_customer: authUser.id_customer,
        total: total_amount,
        currency: "IDR",
        status: "pending",
        midtrans_order_id: order_id,
        info: {
          cart: cart_data,
          customer: arg.customer_details,
        },
      },
    });

    // Create t_sales_line records for each cart item
    for (const cart_item of cart_data) {
      await db.t_sales_line.create({
        data: {
          id_sales: transaction.id,
          id_product: cart_item.type === "product" ? cart_item.id : null,
          id_bundle: cart_item.type === "bundle" ? cart_item.id : null,
          unit_price: cart_item.price,
          qty: 1, // Currently hardcoded to 1 per item
          total_price: cart_item.price, // qty * unit_price
          data: cart_item, // Save the cart item data
        },
      });
    }

    // Prepare Midtrans transaction request
    const customer_details = {
      first_name: arg.customer_details.first_name,
      last_name: arg.customer_details.last_name || "",
      email: arg.customer_details.email,
      phone: MidtransService.formatPhoneNumber(arg.customer_details.phone),
    };

    // Ensure total_amount matches sum of item_details prices
    const calculated_total = item_details.reduce(
      (sum, item) => sum + item.price,
      0
    );
    const final_total = Math.round(calculated_total);

    const payment_request = {
      transaction_details: {
        order_id: order_id,
        gross_amount: final_total,
      },
      item_details: item_details,
      customer_details: customer_details,
      enabled_payments: [
        "credit_card",
        "bca_va",
        "bni_va",
        "bri_va",
        "echannel",
        "permata_va",
        "other_va",
        "gopay",
        "shopeepay",
        "qris",
      ],
      credit_card: {
        secure: true,
      },
      callbacks: {
        finish: `${baseUrl.main_esensi}/payment/success?order_id=${order_id}`,
        unfinish: `${baseUrl.main_esensi}/payment/pending?order_id=${order_id}`,
        error: `${baseUrl.main_esensi}/payment/error?order_id=${order_id}`,
      },
      expiry: {
        unit: "hour" as const,
        duration: 24,
      },
    };

    try {
      // Create Midtrans transaction token
      const { token, redirect_url } = await midtrans.createTransaction(
        payment_request
      );

      const data = {
        title: `Lanjutkan pembayaran`,
        transaction_id: transaction.id,
        snap_token: token,
        redirect_url: redirect_url,
        total_amount: final_total,
        currency: "IDR",
        order_id: order_id,
        items: cart_data,
      };

      const seo_data = {
        slug: `/checkout`,
        meta_title: `Checkout | Selesaikan Pembelian Ebook Digitalmu dengan Aman`,
        meta_description: `Lakukan pembayaran dengan mudah di halaman checkout ini. Selesaikan pembelian eBook Anda dalam beberapa langkah.`,
        image: ``,
        headings: `Checkout | Selesaikan Pembelian Ebook Digitalmu dengan Aman`,
        paragraph: `Lakukan pembayaran dengan mudah di halaman checkout ini. Selesaikan pembelian eBook Anda dalam beberapa langkah.`,
        is_product: false,
      };

      return {
        jsx: (
          <>
            <SeoTemplate data={seo_data} />
          </>
        ),
        data: data,
      };
    } catch (error: any) {
      // Update transaction status to error
      await db.t_sales.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
          midtrans_error: {
            error: error?.message || "Unknown error",
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Clean up t_sales_line records for failed transaction
      await db.t_sales_line.deleteMany({
        where: { id_sales: transaction.id },
      });

      return {
        jsx: <></>,
        data: {
          title: "Error",
          transaction_id: "",
          snap_token: "",
          redirect_url: "",
          total_amount: 0,
          currency: "IDR",
          order_id: "",
          items: [],
        },
      };
    }
  },
});
