import { RajaOngkirService, type RajaOngkirWaybillResponse,  } from "backend/lib/rajaongkir"; 
import { defineAPI } from "rlib/server";
import type { ApiResponse } from "backend/lib/utils";

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;

// The request body payload
interface TrackingRequestBody {
  awb: string;
  courier: string;
}

// The successful response data structure
type TrackingShipmentResponse = RajaOngkirWaybillResponse;

export default defineAPI({
  name: "tracking_shipment",
  url: "/api/tracking-shipment",


  async handler(
    arg: TrackingRequestBody
  ): Promise<ApiResponse<TrackingShipmentResponse>> {
    console.log("Received request to track shipment with payload:", arg);

    if (!RAJAONGKIR_API_KEY) {
      console.error("RAJAONGKIR_API_KEY is not set in environment variables.");
      return {
        success: false,
        message: "Server configuration error.",
      };
    }

    try {
      const { awb, courier } = arg;

      if (!awb || !courier) {
        return {
          success: false,
          message: "Missing required parameters: 'awb' and 'courier' are required.",
        };
      }

      const baseUrl = "https://rajaongkir.komerce.id/api/v1/track/waybill";
      const params = new URLSearchParams({ awb, courier });
      const targetUrl = `${baseUrl}?${params.toString()}`;

      console.log(`Calling RajaOngkir URL: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "key": RAJAONGKIR_API_KEY,
        },
      });

      if (!response.ok) {
        // --- FIX: Add more robust error handling to see the exact response body ---
        const errorText = await response.text();
        console.error("Raw error response from RajaOngkir:", errorText);

        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          // Try to parse the text as JSON to get a more specific message
          const errorBody = JSON.parse(errorText);
          errorMessage = errorBody?.rajaongkir?.status?.description || errorBody?.message || errorMessage;
        } catch (e) {
          // If it's not JSON, use the raw text if it's a reasonable length
          if (errorText && errorText.length < 500) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(`Failed to track waybill: ${errorMessage}`);
      }

      const trackingResult = await response.json() as RajaOngkirWaybillResponse;

      return {
        success: true,
        data: trackingResult,
      };

    } catch (error: any) {
      console.error("Error in /api/tracking-shipment:", error.message);
      return {
        success: false,
        message: error.message || "Gagal melacak pengiriman. Silakan coba lagi.",
      };
    }
  },
});
