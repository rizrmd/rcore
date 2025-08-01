import type { publisher as Publisher } from "shared/models";
import type { ApiResponse } from "backend/src/lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "publisher_get",
  url: "/api/internal/publisher/get",
  async handler(arg: { id: string }): Promise<ApiResponse<Publisher>> {
    const { id } = arg;
    if (!id?.trim())
      return {
        success: false,
        message: "ID penerbit wajib diisi",
      };

    const publisher = await db.publisher.findUnique({
      where: { id },
      include: {
        auth_user: true,
        publisher_author: {
          include: {
            author: {
              include: {
                book: { orderBy: { created_at: "desc" }, take: 10 },
                product: { orderBy: { published_date: "desc" }, take: 10 },
                _count: { select: { book: true, product: true } },
              },
            },
          },
        },
        transaction: { orderBy: { created_at: "desc" }, take: 10 },
        promo_code: { orderBy: { valid_to: "desc" }, take: 10 },
        withdrawal: { orderBy: { requested_at: "desc" }, take: 10 },
      },
    });

    if (!publisher)
      return {
        success: false,
        message: "Penerbit tidak ditemukan",
      };
    return {
      success: true,
      data: publisher,
      message: "Penerbit berhasil diambil",
    };
  },
});