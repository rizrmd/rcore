import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "company_index",
  url: "/api/company",
  async handler(arg: { message: string }) {
    return {
      success: true,
      message: `Hello from company.esensi API: ${arg.message}`,
      timestamp: new Date().toISOString()
    };
  },
});