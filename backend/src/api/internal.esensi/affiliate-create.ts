import type { Affiliate } from "shared/types";
import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "affiliate_create",
  url: "/api/internal/affiliate/create",
  async handler(arg: { name: string }): Promise<ApiResponse<Affiliate>> {
    const { name } = arg;

    // Validate required fields
    if (!name?.trim())
      return { success: false, message: "Nama affiliate wajib diisi" };

    // Check if affiliate with same name already exists
    const existing = await db.affiliate.findFirst({
      where: { name: name.trim() },
    });

    if (existing)
      return {
        success: false,
        message: "Affiliate dengan nama tersebut sudah ada",
      };

    const result = await db.affiliate.create({
      data: { name: name.trim() },
      include: { auth_user: true },
    });

    return { success: true, data: result };
  },
});
