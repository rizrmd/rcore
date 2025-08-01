import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";
import type { ConfigItem } from "shared/types";

export default defineAPI({
  name: "cfg_update",
  url: "/api/internal/cfg/update",
  async handler(arg: {
    key: string;
    value: string;
  }): Promise<ApiResponse<ConfigItem>> {
    const { key, value } = arg;

    // Check if key exists
    const existing = await db.cfg.findUnique({ where: { key } });

    if (!existing)
      return { success: false, message: "Konfigurasi tidak ditemukan" };

    const result = await db.cfg.update({ where: { key }, data: { value } });

    return { success: true, data: result };
  },
});
