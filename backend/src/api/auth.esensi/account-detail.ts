import { defineAPI } from "rlib/server";
import type { Account } from "shared/types";
import type { ApiResponse } from "../../lib/utils";

export default defineAPI({
  name: "account_detail",
  url: "/api/auth/account/detail",
  async handler(arg: { id: string }): Promise<ApiResponse<Account>> {
    try {
      const account = await db.auth_account.findUnique({
        where: { id: arg.id },
        include: { auth_user: true },
      });

      if (!account) return { success: false, message: "Akun tidak ditemukan" };
      return { success: true, data: account };
    } catch (error) {
      console.error("Error in auth_account detail API:", error);
      return { success: false, message: "Gagal mengambil detil akun" };
    }
  },
});
