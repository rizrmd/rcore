import type { User } from "../../lib/better-auth";
import { auth } from "../../lib/better-auth";
import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "auth_login",
  url: "/api/auth/login",
  async handler(arg: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<ApiResponse<{ user: User; session: any }>> {
    try {
      const { email, password, rememberMe = false } = arg;

      // Validate required fields
      if (!email || !password)
        return { success: false, message: "Email dan kata sandi wajib diisi" };

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return { success: false, message: "Format email tidak valid" };

      // Check if user exists
      const existingUser = await db.auth_user.findFirst({
        where: { email: email.toLowerCase() },
        include: {
          customer: true,
          author: true,
          affiliate: true,
          internal: true,
          publisher: true,
        },
      });

      if (!existingUser)
        return { success: false, message: "Email atau kata sandi salah" };

      // Use better-auth to sign in
      const response = await auth.api.signInEmail({
        body: { email: email.toLowerCase(), password, rememberMe },
        asResponse: true,
      });

      // Check if sign in was successful
      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        return {
          success: false,
          message: errorData.message || "Email atau kata sandi salah",
        };
      }

      const authResult = (await response.json()) as {
        user: { id: string; email: string; name: string };
        session: any;
      };

      // Get user data with relations
      const userData = await db.auth_user.findFirst({
        where: { id: authResult.user.id },
        include: {
          customer: true,
          author: true,
          affiliate: true,
          internal: true,
          publisher: true,
        },
      });

      if (!userData)
        return { success: false, message: "Gagal mengambil data pengguna" };

      // Map the user data to match the User type
      const user: User = {
        ...authResult.user,
        customer: userData.customer,
        author: userData.author,
        affiliate: userData.affiliate,
        internal: userData.internal,
        publisher: userData.publisher,
        idCustomer: userData.id_customer,
        idAuthor: userData.id_author,
        idAffiliate: userData.id_affiliate,
        idInternal: userData.id_internal,
        idPublisher: userData.id_publisher,
        username: userData.username,
        displayUsername: userData.display_username,
        twoFactorEnabled: userData.two_factor_enabled,
        emailVerified: userData.email_verified,
        image: userData.image,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at || userData.created_at,
      };

      return { success: true, data: { user, session: authResult.session } };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan saat masuk ke akun",
      };
    }
  },
});
