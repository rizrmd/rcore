import { defineAPI } from "rlib/server";
import type { Account } from "shared/types";
import { betterAuthPasswordUtils, type ApiResponse } from "../../lib/utils";

export default defineAPI({
  name: "account_update",
  url: "/api/auth/account/update",
  async handler(arg: {
    id_user: string;
    password: string;
  }): Promise<ApiResponse<Account>> {
    try {
      const { id_user, password } = arg;

      // Validate required fields
      if (!id_user || !password)
        return { success: false, message: "ID user dan password wajib diisi" };

      // Validate password length
      if (password.length < 8)
        return { success: false, message: "Password minimal 8 karakter" };

      // Hash the password
      // const hashedPassword = await bcrypt.hash(password, 10);
      const hashedPassword = await betterAuthPasswordUtils.hashPassword(
        password
      );

      // Check if user exists
      const user = await db.auth_user.findUnique({
        where: { id: id_user },
      });

      if (!user) return { success: false, message: "User tidak ditemukan" };

      // Check if auth_account already exists for this user
      const existingAccount = await db.auth_account.findFirst({
        where: { id_user, id_provider: "credential" },
      });

      let account;

      if (existingAccount) {
        // Update existing account
        account = await db.auth_account.update({
          where: { id: existingAccount.id },
          data: {
            password: hashedPassword,
            updated_at: new Date(),
          },
          include: { auth_user: true },
        });
      } else {
        // Create new account
        account = await db.auth_account.create({
          data: {
            id_user,
            id_account: id_user,
            password: hashedPassword,
            id_provider: "credential",
            created_at: new Date(),
          },
          include: { auth_user: true },
        });
      }

      return { success: true, data: account };
    } catch (error) {
      console.error("Error in account_update API:", error);
      return {
        success: false,
        message: "Terjadi kesalahan saat memperbarui password",
      };
    }
  },
});
