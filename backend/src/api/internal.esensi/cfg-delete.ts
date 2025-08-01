import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "cfg_delete",
  url: "/api/internal/cfg/delete",
  async handler(arg: { key: string }): Promise<ApiResponse<void>> {
    const { key } = arg;

    // Check if key exists
    const existing = await db.cfg.findUnique({ where: { key } });

    if (!existing)
      return {
        success: false,
        message: "Kunci konfigurasi tidak ditemukan",
      };

    await db.cfg.delete({ where: { key } });
    return { success: true };
  },
});
