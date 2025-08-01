import { createRajaOngkirService } from "backend/lib/rajaongkir";
import type { ApiResponse } from "backend/lib/utils";
import { defineAPI } from "rlib/server";
import { z } from "zod";

// Zod schema for request query validation
const searchSubdistrictSchema = z.object({
  search: z
    .string()
    .min(3, "Search keyword must be at least 3 characters long."),
});

type SearchSubdistrictRequest = z.infer<typeof searchSubdistrictSchema>;

interface SearchSubdistrictResponse {
  subdistrict_id: number;
}

export default defineAPI({
  name: "search_subdistrict",
  url: "/api/shipment/search-subdistrict",
  async handler(
    arg: SearchSubdistrictRequest
  ): Promise<ApiResponse<SearchSubdistrictResponse>> {
    try {
      // Validate input
      const validationResult = searchSubdistrictSchema.safeParse(arg);
      if (!validationResult.success) {
        return {
          success: false,
          message: validationResult.error.message,
        };
      }

      const { search } = validationResult.data;

      // Initialize RajaOngkir service
      const rajaOngkirApiKey = process.env.RAJAONGKIR_API_KEY;
      if (!rajaOngkirApiKey)
        return {
          success: false,
          message: "Location service is not configured.",
        };

      const rajaOngkirService = createRajaOngkirService({
        apiKey: rajaOngkirApiKey,
      });

      // Fetch destination, we only need the first and most relevant result
      const response = await rajaOngkirService.searchDestinations({
        search,
        limit: 1,
      });

      if (response.meta.code !== 200)
        return { success: false, message: response.meta.message };

      // Check if any destination was found
      if (!response.data || response.data.length === 0)
        return {
          success: false,
          message: "Subdistrict not found for the given keyword.",
        };

      // Extract the ID from the first result
      const subdistrictId = response.data[0]?.id;

      return {
        success: true,
        data: {
          subdistrict_id: subdistrictId || 0,
        },
      };
    } catch (error) {
      console.error("Error in search-subdistrict API:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      return {
        success: false,
        message: errorMessage,
      };
    }
  },
});
