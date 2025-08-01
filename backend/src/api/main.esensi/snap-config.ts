import { defineAPI } from "rlib/server";
import { 
  createMidtransService, 
  MIDTRANS_SANDBOX_CONFIG 
} from "../../lib/midtrans";

interface SnapConfigResponse {
  client_key: string;
  snap_js_url: string;
  environment: "sandbox" | "production";
}

export default defineAPI({
  name: "snap_config",
  url: "/api/main/payment/config",
  async handler(): Promise<{ success: boolean; data?: SnapConfigResponse; message?: string }> {
    try {
      // Initialize Midtrans service
      const midtrans = createMidtransService({
        ...MIDTRANS_SANDBOX_CONFIG, // Change to MIDTRANS_PRODUCTION_CONFIG for production
        serverKey: process.env.MIDTRANS_SERVER_KEY!,
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      });

      const config = midtrans.getSnapConfig();

      return {
        success: true,
        data: {
          client_key: config.clientKey,
          snap_js_url: config.snapJs,
          environment: MIDTRANS_SANDBOX_CONFIG.isProduction ? "production" : "sandbox",
        },
      };

    } catch (error) {
      console.error("Error getting Snap config:", error);
      return {
        success: false,
        message: "Gagal mendapatkan konfigurasi pembayaran",
      };
    }
  },
});
