import { defineAPI } from "rlib/server";

interface UpdateReadingProgressResponse {
  success: boolean;
  message?: string;
  data?: {
    reading_progress: {
      last_page: number;
      percent: number;
      status: string;
    };
    ebook: {
      id: string;
      name: string;
    };
  };
  error?: string;
}

export default defineAPI({
  name: "update_reading_progress",
  url: "/api/main/user/reading-progress",
  async handler(arg: {
    id_customer: string;
    id_product: string;
    last_page: number;
    percent: number;
  }): Promise<UpdateReadingProgressResponse> {
    try {
      if (!arg.id_customer || !arg.id_product) {
        return {
          success: false,
          message: "ID customer dan ID product harus diisi",
        };
      }

      // Validate percent is between 0 and 100
      const percent = Math.max(0, Math.min(100, arg.percent || 0));
      const lastPage = Math.max(0, arg.last_page || 0);

      // Find the customer_reader record
      const readerRecord = await db.customer_reader.findFirst({
        where: {
          id_customer: arg.id_customer,
          id_product: arg.id_product,
        },
        include: {
          product: {
            select: {
              name: true,
              content_type: true,
            },
          },
        },
      });

      if (!readerRecord) {
        return {
          success: false,
          message: "Ebook tidak ditemukan di perpustakaan pengguna",
        };
      }

      // Update reading progress
      const updatedRecord = await db.customer_reader.update({
        where: { id: readerRecord.id },
        data: {
          last_page: lastPage,
          percent: percent,
        },
      });

      // Log the reading progress update in midtrx for analytics
      await db.midtrx.create({
        data: {
          type: "reading_progress_update",
          payload: {
            customer_id: arg.id_customer,
            product_id: arg.id_product,
            product_name: readerRecord.product.name,
            previous_progress: {
              last_page: readerRecord.last_page,
              percent: readerRecord.percent,
            },
            new_progress: {
              last_page: lastPage,
              percent: percent,
            },
            progress_change: percent - readerRecord.percent,
            reading_status:
              percent === 0
                ? "not_started"
                : percent === 100
                ? "completed"
                : "reading",
            timestamp: new Date().toISOString(),
          } as any,
        },
      });

      // Determine reading status
      let readingStatus = "reading";
      if (percent === 0) readingStatus = "not_started";
      else if (percent === 100) readingStatus = "completed";

      console.log(
        `📖 Reading progress updated for customer ${arg.id_customer}: "${readerRecord.product.name}" - ${percent}% (Page ${lastPage})`
      );

      return {
        success: true,
        message: "Progres membaca berhasil diperbarui",
        data: {
          reading_progress: {
            last_page: lastPage,
            percent: percent,
            status: readingStatus,
          },
          ebook: {
            id: arg.id_product,
            name: readerRecord.product.name,
          },
        },
      };
    } catch (error) {
      console.error("Error updating reading progress:", error);
      return {
        success: false,
        message: "Gagal memperbarui progres membaca",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
