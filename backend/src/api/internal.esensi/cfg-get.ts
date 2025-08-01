import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";
import type { ConfigItem } from "shared/types";

export default defineAPI({
  name: "cfg_get",
  url: "/api/internal/cfg/get",
  async handler(arg: { key: string }): Promise<ApiResponse<ConfigItem>> {
    const { key } = arg;

    const result = await db.cfg.findUnique({ where: { key } });

    if (!result)
      return { success: false, message: "Kunci konfigurasi tidak ditemukan" };

    return { success: true, data: result };
  },
});
