import type { Affiliate } from "shared/types";
import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "affiliate_get",
  url: "/api/internal/affiliate/get",
  async handler(arg: { id: string }): Promise<ApiResponse<Affiliate>> {
    const { id } = arg;
    if (!id?.trim())
      return { success: false, message: "ID affiliate wajib diisi" };

    const affiliate = await db.affiliate.findUnique({
      where: { id },
      include: { auth_user: true },
    });

    if (!affiliate)
      return { success: false, message: "Affiliate tidak ditemukan" };
    return { success: true, data: affiliate };
  },
});
