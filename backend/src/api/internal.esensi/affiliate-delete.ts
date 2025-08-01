import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "affiliate_delete",
  url: "/api/internal/affiliate/delete",
  async handler(arg: { id: string }): Promise<ApiResponse<void>> {
    const { id } = arg;
    if (!id?.trim())
      return { success: false, message: "ID affiliate wajib diisi" };

    // Check if affiliate exists
    const existing = await db.affiliate.findUnique({
      where: { id },
      include: { auth_user: true },
    });

    if (!existing)
      return { success: false, message: "Affiliate tidak ditemukan" };

    await db.affiliate.delete({ where: { id } });
    return { success: true };
  },
});
