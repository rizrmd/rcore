import type { User } from "../../lib/better-auth";
import { auth } from "../../lib/better-auth";
import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "auth_register",
  url: "/api/auth/register",
  async handler(arg: {
    fullname: string;
    email: string;
    password: string;
    password2?: string;
    terms_agree?: boolean;
  }): Promise<ApiResponse<{ user: User; session: any }>> {
    try {
      const { fullname, email, password, password2, terms_agree } = arg;

      // Validate required fields
      if (!fullname || !email || !password)
        return {
          success: false,
          message: "Nama lengkap, email, dan kata sandi wajib diisi",
        };

      // Validate password confirmation if provided
      if (password2 && password !== password2)
        return {
          success: false,
          message: "Konfirmasi kata sandi tidak sesuai",
        };

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return { success: false, message: "Format email tidak valid" };

      // Validate password length
      if (password.length < 8)
        return { success: false, message: "Kata sandi setidaknya 8 karakter" };

      // Validate terms agreement if provided
      if (terms_agree !== undefined && !terms_agree)
        return {
          success: false,
          message: "Anda harus menyetujui syarat dan ketentuan",
        };

      // Check if user already exists
      const existingUser = await db.auth_user.findFirst({
        where: { email: email.toLowerCase() },
      });

      if (existingUser)
        return { success: false, message: "Email sudah terdaftar" };

      // Use better-auth to sign up
      const response = await auth.api.signUpEmail({
        body: { name: fullname, email: email.toLowerCase(), password },
        asResponse: true,
      });

      // Check if sign up was successful
      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        return {
          success: false,
          message: errorData.message || "Gagal mendaftarkan akun",
        };
      }

      const authResult = (await response.json()) as {
        user: { id: string; email: string; name: string };
        session: any;
      };

      // Create customer record for the new user
      const newCustomer = await db.customer.create({
        data: {
          name: fullname,
          email: email.toLowerCase(),
          whatsapp: "", // Will be filled later by user
        },
      });

      // Update user with customer ID
      await db.auth_user.update({
        where: { id: authResult.user.id },
        data: { id_customer: newCustomer.id },
      });

      // Get updated user data with relations
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
      console.error("Register error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan saat mendaftarkan akun",
      };
    }
  },
});
