import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";
import type { ConfigItem } from "shared/types";

export default defineAPI({
  name: "cfg_create",
  url: "/api/internal/cfg/create",
  async handler(arg: {
    key: string;
    value: string;
  }): Promise<ApiResponse<ConfigItem>> {
    const { key, value } = arg;

    // Check if key already exists
    const existing = await db.cfg.findUnique({ where: { key } });

    if (existing)
      return {
        success: false,
        message: "Konfigurasi dengan kunci tersebut sudah ada",
      };

    const result = await db.cfg.create({ data: { key, value } });
    return { success: true, data: result };
  },
});
