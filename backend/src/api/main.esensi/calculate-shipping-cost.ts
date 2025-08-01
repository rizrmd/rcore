import {
  createRajaOngkirService,
  type RajaOngkirCostResponse,
} from "backend/lib/rajaongkir";
import type { ApiResponse } from "backend/lib/utils";
import { defineAPI } from "rlib/server";
import { z } from "zod";

// Zod schema for request body validation
const calculateCostSchema = z.object({
  origin: z.string().min(1, "Origin is required."),
  destination: z.string().min(1, "Destination is required."),
  weight: z
    .number()
    .int()
    .positive("Weight must be a positive integer in grams."),
  price: z.enum(["lowest", "highest"]).optional().default("lowest"),
});

type CalculateCostRequest = z.infer<typeof calculateCostSchema>;

export interface ShippingOption {
  courier_code: string;
  courier_name: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

interface CalculateCostResponse {
  options: ShippingOption[];
}

export default defineAPI({
  name: "calculate_shipping_cost",
  url: "/api/shipment/cost",
  async handler(
    arg: Partial<CalculateCostRequest>
  ): Promise<ApiResponse<CalculateCostResponse>> {
    try {
      const validationResult = calculateCostSchema.safeParse(arg);
      if (!validationResult.success) {
        return { success: false, message: "Invalid input data." };
      }

      const { origin, destination, weight, price } = validationResult.data;

      const rajaOngkirApiKey = process.env.RAJAONGKIR_API_KEY;
      if (!rajaOngkirApiKey) {
        return {
          success: false,
          message: "Shipping service is not configured.",
        };
      }

      const rajaOngkirService = createRajaOngkirService({
        apiKey: rajaOngkirApiKey,
      });

      const couriers =
        "jne:sicepat:ide:sap:jnt:ninja:tiki:lion:anteraja:pos:ncs:rex:rpx:sentral:star:wahana:dse";

      // The response type from the service is different than originally thought.
      // We will handle it as a generic object first.
      const response: any = await rajaOngkirService.calculateCost({
        origin,
        destination,
        weight,
        courier: couriers,
      });

      // --- NEW FIX STARTS HERE ---

      // 1. Check for the new, correct structure.
      if (!response || !response.meta || !response.data) {
        console.error(
          "Invalid or incomplete response from RajaOngkir service:",
          response
        );
        return {
          success: false,
          message: "Gagal berkomunikasi dengan servis pengiriman.",
        };
      }

      // 2. Check the status from the 'meta' object.
      if (response.meta.code !== 200) {
        return {
          success: false,
          message:
            response.meta.message || "Servis pengiriman mengembalikan error.",
        };
      }

      // 3. Map the results directly from the 'data' array.
      // The structure is simpler now.
      const shippingOptions: ShippingOption[] = response.data.map(
        (opt: any) => ({
          courier_code: opt.code,
          courier_name: opt.name,
          service: opt.service,
          description: opt.description,
          cost: opt.cost,
          etd: opt.etd.replace(/ hari/i, "").trim(), // Clean up the 'etd' string
        })
      );

      // --- NEW FIX ENDS HERE ---

      shippingOptions.sort((a, b) =>
        price === "lowest" ? a.cost - b.cost : b.cost - a.cost
      );

      return {
        success: true,
        data: {
          options: shippingOptions,
        },
      };
    } catch (error) {
      console.error("Error in calculate-shipping-cost API:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      return {
        success: false,
        message: errorMessage,
      };
    }
  },
});
