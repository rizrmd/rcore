import type { AffiliateStats } from "shared/types";
import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "affiliate_stats",
  url: "/api/internal/affiliate/stats",
  async handler(arg: { id?: string }): Promise<ApiResponse<AffiliateStats>> {
    const { id } = arg;

    if (id) {
      // Get stats for specific affiliate
      const affiliate = await db.affiliate.findUnique({
        where: { id },
        include: { auth_user: true },
      });

      if (!affiliate)
        return { success: false, message: "Affiliate tidak ditemukan" };

      return {
        success: true,
        data: { affiliate },
        message: "Statistik affiliate berhasil diambil",
      };
    } else {
      // Get overall stats
      const [totalAffiliates, affiliatesWithUsers] = await Promise.all([
        db.affiliate.count(),
        db.affiliate.count({ where: { auth_user: { id_affiliate: id } } }),
      ]);

      return {
        success: true,
        data: {
          total_affiliates: totalAffiliates,
          affiliates_with_users: affiliatesWithUsers,
        },
      };
    }
  },
});
