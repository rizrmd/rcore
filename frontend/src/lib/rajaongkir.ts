// =================================================================
// rajaongkir.ts - The updated service library
// =================================================================

// Type definitions based on RajaOngkir API documentation
export interface RajaOngkirConfig {
  apiKey: string;
  baseUrl?: string; // e.g., https://api.rajaongkir.com/starter
}

export interface CostRequest {
  origin: string;
  destination: string;
  weight: number;
  courier: string;
}

export interface CostResult {
  code: string;
  name: string;
  costs: ServiceCost[];
}

export interface ServiceCost {
  service: string;
  description: string;
  cost: CostDetail[];
}

export interface CostDetail {
  value: number;
  etd: string;
  note: string;
}

export interface RajaOngkirCostResponse {
  rajaongkir: {
    query: CostRequest;
    status: {
      code: number;
      description: string;
    };
    origin_details: any;
    destination_details: any;
    results: CostResult[];
  };
}

// Interfaces for the Search Destination endpoint
export interface SearchDestinationRequest {
  search: string;
  limit?: number;
  offset?: number;
}

export interface KomerceDestinationDetails {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
}

export interface KomerceSearchDestinationResponse {
  meta: {
    message: string;
    code: number;
    status: string;
  };
  data: KomerceDestinationDetails[];
}

// --- NEW: Interfaces for the Airwaybill Tracking endpoint ---
export interface WaybillRequest {
  awb: string;
  courier: string;
}

export interface WaybillManifest {
    manifest_code: string;
    manifest_description: string;
    manifest_date: string;
    manifest_time: string;
    city_name: string;
}

export interface WaybillDetails {
    waybill_number: string;
    waybill_date: string;
    waybill_time: string;
    weight: string;
    origin: string;
    destination: string;
    shippper_name: string;
    shipper_address1: string;
    shipper_city: string;
    receiver_name: string;
    receiver_address1: string;
    receiver_address2: string;
    receiver_address3: string;
    receiver_city: string;
}

export interface WaybillResult {
    delivered: boolean;
    summary: {
        courier_code: string;
        courier_name: string;
        waybill_number: string;
        service: string;
        shipper_name: string;
        receiver_name: string;
        origin: string;
        destination: string;
        status: string;
    };
    details: WaybillDetails;
    manifest: WaybillManifest[];
    delivery_status?: {
        status: string;
        pod_receiver: string;
        pod_date: string;
        pod_time: string;
    };
}

export interface RajaOngkirWaybillResponse {
    rajaongkir: {
        query: WaybillRequest;
        status: {
            code: number;
            description: string;
        };
        result: WaybillResult;
    };
}
// --- END NEW ---


export class RajaOngkirService {
  private config: RajaOngkirConfig;

  constructor(config: RajaOngkirConfig) {
    if (!config.apiKey) {
      throw new Error("RajaOngkir API key is required.");
    }
    this.config = {
      ...config,
      baseUrl: config.baseUrl || "https://rajaongkir.komerce.id/api/",
    };
  }

  /**
   * Calculate domestic shipping cost.
   * @param params - The cost calculation parameters.
   * @returns The shipping cost options.
   */
  async calculateCost(params: CostRequest): Promise<RajaOngkirCostResponse> {
    const response = await fetch(
      `${this.config.baseUrl}v1/calculate/domestic-cost`,
      {
        method: "POST",
        headers: {
          key: this.config.apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params as any),
      }
    );

    if (!response.ok) {
      const errorBody = (await response.json()) as any;
      const errorMessage =
        errorBody?.rajaongkir?.status?.description ||
        `HTTP error! status: ${response.status}`;
      throw new Error(`Failed to fetch shipping cost: ${errorMessage}`);
    }

    return (await response.json()) as RajaOngkirCostResponse;
  }

  /**
   * Search for domestic destinations.
   * @param params - The search parameters.
   * @returns A list of matching destinations.
   */
  async searchDestinations(
    params: SearchDestinationRequest
  ): Promise<KomerceSearchDestinationResponse> {
    const url = new URL(
      `${this.config.baseUrl}v1/destination/domestic-destination`
    );

    url.searchParams.append("search", params.search);
    if (params.limit) {
      url.searchParams.append("limit", params.limit.toString());
    }
    if (params.offset) {
      url.searchParams.append("offset", params.offset.toString());
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        key: this.config.apiKey,
      },
    });

    if (!response.ok) {
      const errorBody = (await response.json()) as any;
      const errorMessage =
        errorBody?.meta?.message ||
        errorBody?.message ||
        `HTTP error! status: ${response.status}`;
      throw new Error(`Failed to search destinations: ${errorMessage}`);
    }

    return (await response.json()) as KomerceSearchDestinationResponse;
  }

  /**
   * NEW: Track a shipment using an airwaybill number.
   * @param params - The tracking parameters (awb and courier).
   * @returns The shipment tracking details.
   */
  async trackWaybill(params: WaybillRequest): Promise<RajaOngkirWaybillResponse> {
    const response = await fetch(
        `${this.config.baseUrl}v1/track/waybill`, 
        {
            method: "POST",
            headers: {
                key: this.config.apiKey,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            // FIX: Cast params to 'any' to satisfy URLSearchParams constructor
            body: new URLSearchParams(params as any),
        }
    );

    if (!response.ok) {
        const errorBody = (await response.json()) as any;
        const errorMessage =
            errorBody?.rajaongkir?.status?.description ||
            `HTTP error! status: ${response.status}`;
        throw new Error(`Failed to track waybill: ${errorMessage}`);
    }

    return (await response.json()) as RajaOngkirWaybillResponse;
  }
}

export function createRajaOngkirService(
  config: RajaOngkirConfig
): RajaOngkirService {
  return new RajaOngkirService(config);
}
