import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "health",
  url: "/api/health",
  async handler() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "api",
      version: "1.0.0"
    };
  },
});