import { defineAPI } from "rlib/server";
import type { ConfigItem } from "shared/types";
import type { ApiResponse } from "../../lib/utils";

export default defineAPI({
  name: "cfg_bulk_get",
  url: "/api/internal/cfg/bulk-get",
  async handler(arg: { keys: string[] }): Promise<ApiResponse<ConfigItem[]>> {
    const { keys } = arg;

    if (!Array.isArray(keys) || keys.length === 0) {
      return {
        success: false,
        message: "Keys array is required and cannot be empty",
      };
    }

    const results = await db.cfg.findMany({
      where: {
        key: {
          in: keys,
        },
      },
    });

    return { success: true, data: results };
  },
});
