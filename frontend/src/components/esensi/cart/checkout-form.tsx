import { Button } from "@/components/ui/button";
import { betterAuth } from "@/lib/better-auth";
import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { initMidtransPayment } from "@/lib/midtrans";
import { navigate } from "@/lib/router";
import { userState } from "@/lib/states/user-state";
import type { User } from "shared/types";
import { useSnapshot } from "valtio";

interface CheckoutFormProps {
  cartItems: any[];
  total: number;
  onSuccess?: () => void;
  shippingAddress?: any;
  // This prop MUST now be an array of shipment details
  shippingInfo?: {
    id_author: string;
    shipping_provider: string;
    shipping_service: string;
    shipping_cost: number;
  }[];
}

export const current = {
  user: undefined as User | undefined,
};

export const CheckoutForm = ({
  cartItems,
  total,
  onSuccess,
  shippingAddress,
  shippingInfo,
}: CheckoutFormProps) => {
  const userRead = useSnapshot(userState.write);

  const local = useLocal(
    {
      initializing: true,
      loading: false,
      customerData: {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
      },
    },
    async () => {
      try {
        const res = await betterAuth.getSession();
        const user = res.data?.user;
        current.user = user;
        userState.setUser(user || null);

        if (user) {
          const nameParts = user.name?.split(" ") || [];
          local.customerData.first_name = nameParts[0] || "";
          local.customerData.last_name = nameParts.slice(1).join(" ") || "";
          local.customerData.email = user.email || "";
          local.customerData.phone = user.customer?.whatsapp || "";
        }
      } catch (error) {
        console.error("Failed to fetch user session:", error);
      } finally {
        local.initializing = false;
        local.render();
      }
    }
  );

  const handleCheckout = async () => {
    if (!userRead.user) {
      if (window.confirm("Anda harus login untuk checkout. Ingin login sekarang?")) {
        navigate(`/login?redirectURL=${encodeURIComponent(window.location.href)}`);
      }
      return;
    }
    const hasPhysicalItem = cartItems.some((item) => item.is_physical === true);
    if (hasPhysicalItem && (!shippingAddress || !shippingInfo || shippingInfo.length === 0)) {
      alert("Mohon pilih alamat dan metode pengiriman untuk semua pesanan.");
      return;
    }

    local.loading = true;
    local.render();

    try {
      // Step 1: Create the payment record, which returns the single sales_id
      const paymentResult = await api.create_payment({
        user: userRead.user!,
        cart_items: cartItems.map((item) => ({
          id: item.id,
          type: item.type,
          quantity: item.quantity,
        })),
      });

      if (!paymentResult.success || !paymentResult.data) {
        throw new Error(paymentResult.message || "Gagal memproses pembayaran.");
      }

      const { sales_id, snap_token } = paymentResult.data;

      // Step 2: If there are physical items, create all necessary shipments
      if (hasPhysicalItem) {
        // --- FIX: Construct the payload with the nested `shipments` array ---
        const shipmentPayload = {
          user: userRead.user!,
          id_sales: sales_id,
          
          // Recipient info (same for all shipments in this order)
          recipient_name: `${shippingAddress.recipient_name || userRead.user.name}`,
          recipient_phone: `${shippingAddress.recipient_phone || userRead.user.customer?.whatsapp}`,
          address_line: shippingAddress.address,
          city: shippingAddress.city,
          province: shippingAddress.province,
          postal_code: shippingAddress.postal_code,
          notes: shippingAddress.notes,
          
          // The array of shipment details passed via props
          shipments: shippingInfo!,
        };

        // Call the API with the single, correctly structured payload
        const shipmentResult = await api.create_shipment(shipmentPayload);
        // Note: I'm using `create_shipments_for_order` as the function name. 
        // If your generated client still uses `create_shipment`, use that name instead.

        if (!shipmentResult.success) {
          throw new Error(shipmentResult.message || "Gagal membuat data pengiriman.");
        }
      }

      // Step 3: Proceed to Midtrans payment
      await initMidtransPayment(snap_token, {
        onSuccess: (res: any) => {
          navigate(`/payment/success?order_id=${res.order_id}`);
          if (onSuccess) onSuccess();
        },
        onClose: () => {
          local.loading = false;
          local.render();
        },
      });

    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(`Terjadi kesalahan: ${error?.message || "Unknown error"}`);
      local.loading = false;
      local.render();
    }
  };

  const handleDirectCheckout = async () => {
    if (!userRead.user) {
      if (
        window.confirm("Anda harus login untuk checkout. Ingin login sekarang?")
      ) {
        const currentURL = encodeURIComponent(window.location.href);
        navigate(`/login?redirectURL=${currentURL}`);
      }
      return;
    }

    const hasPhysicalItem = cartItems.some(
      (item) => (item as any).is_physical === true
    );

    if (hasPhysicalItem) {
      if (!shippingAddress) {
        alert(
          "Mohon pilih alamat pengiriman di ringkasan keranjang untuk melanjutkan."
        );
        return;
      }
      if (!shippingInfo || shippingInfo.length === 0) {
        alert(
          "Mohon pilih metode pengiriman untuk melanjutkan."
        );
        return;
      }
    }

    await handleCheckout();
  };

  return (
    <Button
      className="flex items-center justify-center gap-2 bg-[#C6011B] text-white lg:bg-[#D4D8F7] hover:lg:bg-[#D4D8F7] lg:text-[#3B2C93] px-10 h-full rounded-lg"
      onClick={handleDirectCheckout}
      disabled={local.initializing || cartItems.length === 0 || local.loading}
    >
      {local.initializing ? "Memuat..." : local.loading ? "Memproses..." : "Checkout"}
    </Button>
  );
};

export default CheckoutForm;