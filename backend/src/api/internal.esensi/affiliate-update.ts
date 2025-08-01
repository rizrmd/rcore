import type { Affiliate } from "shared/types";
import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "affiliate_update",
  url: "/api/internal/affiliate/update",
  async handler(arg: {
    id: string;
    name?: string;
  }): Promise<ApiResponse<Affiliate>> {
    const { id, name } = arg;

    if (!id?.trim())
      return { success: false, message: "ID affiliate wajib diisi" };

    // Check if affiliate exists
    const existing = await db.affiliate.findUnique({ where: { id } });

    if (!existing)
      return { success: false, message: "Affiliate tidak ditemukan" };

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existing.name) {
      const nameExists = await db.affiliate.findFirst({
        where: { name: name.trim(), id: { not: id } },
      });

      if (nameExists)
        return {
          success: false,
          message: "Affiliate dengan nama tersebut sudah ada",
        };
    }

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();

    const result = await db.affiliate.update({
      where: { id },
      data: updateData,
      include: { auth_user: true },
    });

    return { success: true, data: result };
  },
});
