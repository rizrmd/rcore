import { apiClient } from "rlib/client";
import type { backendApi } from "../../../../backend/src/gen/api";
import { endpoints } from "../../../../backend/src/gen/api.url";
import config from "../../../../config.json";
import { apiFetch } from "../api-fetch";

// Create API client with custom fetch that includes credentials
export const api = apiClient(
  {} as unknown as typeof backendApi,
  endpoints,
  { ...config, fetch: apiFetch },
  "publish.esensi"
);