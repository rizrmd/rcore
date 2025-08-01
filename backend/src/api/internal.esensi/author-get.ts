import type { author as Author } from "shared/models";
import type { ApiResponse } from "backend/src/lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "author_get",
  url: "/api/internal/author/get",
  async handler(arg: { id: string }): Promise<ApiResponse<Author>> {
    const { id } = arg;
    if (!id?.trim())
      return {
        success: false,
        message: "ID penulis wajib diisi",
      };

    const author = await db.author.findUnique({
      where: { id },
      include: {
        auth_user: true,
        publisher_author: {
          include: {
            publisher: {
              include: {
                transaction: { orderBy: { created_at: "desc" }, take: 10 },
                promo_code: { orderBy: { valid_to: "desc" }, take: 10 },
              },
            },
          },
        },
        book: { orderBy: { published_date: "desc" }, take: 10 },
        product: { orderBy: { published_date: "desc" }, take: 10 },
        bundle: { orderBy: { created_at: "desc" }, take: 10 },
      },
    });

    if (!author) return { success: false, message: "Penulis tidak ditemukan" };
    return { success: true, data: author };
  },
});