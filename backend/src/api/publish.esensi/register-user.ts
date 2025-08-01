import type { User } from "backend/lib/better-auth";
import type { ApiResponse } from "backend/lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "register_author",
  url: "/api/publish/auth/register-author",
  async handler(arg: { user: Partial<User> }): Promise<ApiResponse<void>> {
    try {
      const { user } = arg;

      const existingUser = await db.auth_user.findFirst({
        where: { id: user.id },
      });

      if (existingUser?.id_author)
        return {
          success: false,
          message: "Pengguna sudah terdaftar sebagai penulis",
        };

      const newAuthor = await db.author.create({
        data: { name: user.name! },
      });

      await db.auth_user.update({
        where: { id: user.id },
        data: { id_author: newAuthor.id },
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: "Terjadi kesalahan saat mendaftarkan akun penulis",
      };
    }
  },
});
