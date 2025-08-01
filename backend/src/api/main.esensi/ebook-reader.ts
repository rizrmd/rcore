import { defineAPI } from "rlib/server";

interface EbookReaderResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    ebook: {
      id: string;
      name: string;
      slug: string;
      content_type: string | null;
      cover: string;
      description: string | null;
      author: string;
      files: any[];
      metadata: any;
    };
    reading_progress: {
      last_page: number;
      percent: number;
      status: string;
    };
    reader_config: {
      can_download: boolean;
      can_print: boolean;
      max_zoom: number;
      min_zoom: number;
    };
  };
}

export default defineAPI({
  name: "ebook_reader",
  url: "/api/main/ebook/reader",
  async handler(arg: {
    id_customer: string;
    id_product: string;
  }): Promise<EbookReaderResponse> {
    try {
      if (!arg.id_customer || !arg.id_product) {
        return {
          success: false,
          message: "ID customer dan ID product harus diisi",
        };
      }

      // Check if customer has access to this ebook
      const readerAccess = await db.customer_reader.findFirst({
        where: {
          id_customer: arg.id_customer,
          id_product: arg.id_product,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              content_type: true,
              cover: true,
              desc: true,
              product_file: true,
              info: true,
              status: true,
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!readerAccess) {
        return {
          success: false,
          message: "Anda tidak memiliki akses untuk membaca ebook ini",
        };
      }

      if (readerAccess.product.status !== "active") {
        return {
          success: false,
          message: "Ebook ini sedang tidak tersedia",
        };
      }

      // Parse product files to get ebook content
      let productFiles = [];
      try {
        productFiles = JSON.parse(readerAccess.product.product_file || "[]");
      } catch (e) {
        console.warn(
          "Invalid product_file JSON:",
          readerAccess.product.product_file
        );
      }

      // Get ebook file URLs (assuming they're stored in product_file)
      const ebookFiles = productFiles.filter(
        (file: any) =>
          file.type === "ebook" ||
          file.name?.toLowerCase().includes(".pdf") ||
          file.name?.toLowerCase().includes(".epub")
      );

      // Log reading session start in midtrx
      await db.midtrx.create({
        data: {
          type: "reading_session_start",
          payload: {
            customer_id: arg.id_customer,
            product_id: arg.id_product,
            product_name: readerAccess.product.name,
            current_progress: {
              last_page: readerAccess.last_page,
              percent: readerAccess.percent,
            },
            session_start: new Date().toISOString(),
          } as any,
        },
      });

      return {
        success: true,
        data: {
          ebook: {
            id: readerAccess.product.id,
            name: readerAccess.product.name,
            slug: readerAccess.product.slug,
            content_type: readerAccess.product.content_type,
            cover: readerAccess.product.cover,
            description: readerAccess.product.desc,
            author: readerAccess.product.author?.name || "Unknown Author",
            files: ebookFiles,
            metadata: readerAccess.product.info || {},
          },
          reading_progress: {
            last_page: readerAccess.last_page,
            percent: readerAccess.percent,
            status:
              readerAccess.percent === 0
                ? "not_started"
                : readerAccess.percent === 100
                ? "completed"
                : "reading",
          },
          reader_config: {
            can_download: false, // Set based on your business rules
            can_print: false, // Set based on your business rules
            max_zoom: 200,
            min_zoom: 50,
          },
        },
      };
    } catch (error) {
      console.error("Error getting ebook reader data:", error);
      return {
        success: false,
        message: "Gagal membuka pembaca ebook",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
