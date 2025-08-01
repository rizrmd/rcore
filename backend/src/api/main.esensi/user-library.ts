import { defineAPI } from "rlib/server";

interface UserLibraryResponse {
  success: boolean;
  data?: {
    library: Array<{
      id: string;
      reading_progress: {
        id: string | null;
        last_page: number;
        percent: number;
        status: string;
        last_read: Date | null;
      };
      ebook: {
        id: string;
        name: string;
        slug: string;
        content_type: string;
        cover: string;
        author: string;
        price: any;
        strike_price: any;
        currency: string;
        description: string;
        status: string;
      };
      can_read: boolean;
      download_info: any;
      purchase_date: Date;
      from_bundle: string | null;
    }>;
    statistics: {
      total_ebooks: number;
      not_started: number;
      reading: number;
      completed: number;
      average_progress: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message?: string;
  error?: string;
}

export default defineAPI({
  name: "user_library",
  url: "/api/main/user/library",
  async handler(arg: {
    id_customer?: string;
    page?: number;
    limit?: number;
    search?: string;
    filter_type?: string;
  }): Promise<UserLibraryResponse> {
    try {
      const page = arg.page || 1;
      const limit = Math.min(arg.limit || 20, 100);
      const offset = (page - 1) * limit;

      if (!arg.id_customer) {
        return {
          success: false,
          message: "ID customer harus diisi",
        };
      }

      // First, get all purchased products from sales (including different statuses)
      const purchasedProducts = await db.t_sales.findMany({
        where: {
          id_customer: arg.id_customer,
          status: {
            in: ["success", "paid", "completed", "settlement"], // Multiple possible success statuses
          },
        },
        include: {
          t_sales_line: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  content_type: true,
                  currency: true,
                  real_price: true,
                  strike_price: true,
                  cover: true,
                  info: true,
                  status: true,
                  id_author: true,
                  desc: true,
                  author: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              bundle: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  currency: true,
                  real_price: true,
                  strike_price: true,
                  cover: true,
                  info: true,
                  status: true,
                  id_author: true,
                  desc: true,
                  author: {
                    select: {
                      name: true,
                    },
                  },
                  bundle_product: {
                    include: {
                      product: {
                        select: {
                          id: true,
                          name: true,
                          slug: true,
                          content_type: true,
                          currency: true,
                          real_price: true,
                          strike_price: true,
                          cover: true,
                          info: true,
                          status: true,
                          id_author: true,
                          desc: true,
                          author: {
                            select: {
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Also get all downloaded products (even if not explicitly purchased)
      const downloadedProducts = await db.t_sales_download.findMany({
        where: {
          id_customer: arg.id_customer,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              content_type: true,
              currency: true,
              real_price: true,
              strike_price: true,
              cover: true,
              info: true,
              status: true,
              id_author: true,
              desc: true,
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Extract unique products from purchases (including bundle products)
      const allProducts = new Map();

      for (const sale of purchasedProducts) {
        for (const line of sale.t_sales_line) {
          if (line.product) {
            allProducts.set(line.product.id, {
              ...line.product,
              content_type: line.product.content_type || "ebook",
              purchase_date: sale.created_at,
              source: "purchase",
            });
          }

          // Handle bundle products
          if (line.bundle) {
            for (const bundleProduct of line.bundle.bundle_product) {
              if (bundleProduct.product) {
                allProducts.set(bundleProduct.product.id, {
                  ...bundleProduct.product,
                  content_type: bundleProduct.product.content_type || "ebook",
                  purchase_date: sale.created_at,
                  from_bundle: line.bundle.name,
                  source: "bundle",
                });
              }
            }
          }
        }
      }

      // Add downloaded products that might not be in purchases
      for (const download of downloadedProducts) {
        if (download.product && !allProducts.has(download.product.id)) {
          allProducts.set(download.product.id, {
            ...download.product,
            content_type: download.product.content_type || "ebook",
            purchase_date: download.downloaded_at,
            source: "download",
          });
        }
      }

      // Get reading progress for all products
      const productIds = Array.from(allProducts.keys());

      // Create reading progress map
      const progressMap = new Map();

      // If no products found from sales/downloads, check customer_reader for legacy data
      if (productIds.length === 0) {
        const legacyReads = await db.customer_reader.findMany({
          where: {
            id_customer: arg.id_customer,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                content_type: true,
                currency: true,
                real_price: true,
                strike_price: true,
                cover: true,
                info: true,
                status: true,
                id_author: true,
                desc: true,
                author: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Add legacy products to allProducts map
        for (const read of legacyReads) {
          if (read.product) {
            allProducts.set(read.product.id, {
              ...read.product,
              content_type: read.product.content_type || "ebook",
              purchase_date: new Date(), // No purchase date available for legacy
              source: "legacy",
            });

            // Also add to progress map
            progressMap.set(read.product.id, {
              id: read.id,
              last_page: read.last_page,
              percent: read.percent,
              last_read: read.last_read,
              status:
                read.percent === 0
                  ? "not_started"
                  : read.percent === 100
                  ? "completed"
                  : "reading",
            });
          }
        }
      } else {
        // Get reading progress for purchased/downloaded products
        const readingProgress = await db.customer_reader.findMany({
          where: {
            id_customer: arg.id_customer,
            id_product: {
              in: productIds,
            },
          },
        });

        readingProgress.forEach((progress) => {
          progressMap.set(progress.id_product, {
            id: progress.id,
            last_page: progress.last_page,
            percent: progress.percent,
            last_read: progress.last_read,
            status:
              progress.percent === 0
                ? "not_started"
                : progress.percent === 100
                ? "completed"
                : "reading",
          });
        });
      }

      // Get download info for all products
      const allProductIds = Array.from(allProducts.keys());
      if (allProductIds.length === 0) {
        return {
          success: true,
          data: {
            library: [],
            statistics: {
              total_ebooks: 0,
              not_started: 0,
              reading: 0,
              completed: 0,
              average_progress: 0,
            },
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        };
      }

      const downloads = await db.t_sales_download.findMany({
        where: {
          id_customer: arg.id_customer,
          id_product: {
            in: allProductIds,
          },
        },
      });

      const downloadMap = new Map();
      downloads.forEach((download) => {
        downloadMap.set(download.id_product, {
          downloaded_at: download.downloaded_at,
          download_key: download.download_key,
        });
      });

      // Convert products to array and apply filters
      let filteredProducts = Array.from(allProducts.values());

      // Apply search filter
      if (arg.search) {
        const searchLower = arg.search.toLowerCase();
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.author?.name?.toLowerCase().includes(searchLower)
        );
      }

      // Apply content type filter
      if (arg.filter_type && arg.filter_type !== "all") {
        filteredProducts = filteredProducts.filter(
          (product) => product.content_type === arg.filter_type
        );
      }

      // Get total count after filtering
      const total = filteredProducts.length;

      // Apply pagination
      const paginatedProducts = filteredProducts
        .sort((a, b) => {
          // Sort by last read time (most recent first), then by purchase date (newest first)
          const lastReadA = progressMap.get(a.id)?.last_read;
          const lastReadB = progressMap.get(b.id)?.last_read;

          // Books with recent reads come first
          if (lastReadA && lastReadB) {
            return new Date(lastReadB).getTime() - new Date(lastReadA).getTime();
          }
          
          // Books with any read time come before never-read books
          if (lastReadA && !lastReadB) return -1;
          if (!lastReadA && lastReadB) return 1;
          
          // For books never read, sort by purchase date (newest first)
          return (
            new Date(b.purchase_date).getTime() -
            new Date(a.purchase_date).getTime()
          );
        })
        .slice(offset, offset + limit);

      // Format the response
      const formattedLibrary = paginatedProducts.map((product) => {
        const progress = progressMap.get(product.id) || {
          id: null,
          last_page: 0,
          percent: 0,
          status: "not_started",
          last_read: null,
        };

        const download = downloadMap.get(product.id);

        return {
          id: progress.id || `library_${product.id}`,
          reading_progress: progress,
          ebook: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            content_type: product.content_type,
            cover: product.cover,
            author: product.author?.name,
            price: product.real_price,
            strike_price: product.strike_price,
            currency: product.currency,
            description:
              product.desc || (product.info as any)?.description || "",
            status: product.status,
          },
          can_read: product.status === "active",
          download_info: download || null,
          purchase_date: product.purchase_date,
          from_bundle: product.from_bundle || null,
        };
      });

      // Calculate library statistics based on all purchased products
      const allProgress = Array.from(allProducts.keys()).map((productId) => {
        const progress = progressMap.get(productId);
        return progress ? progress.percent : 0;
      });

      const stats = {
        total_ebooks: total,
        not_started: allProgress.filter((p) => p === 0).length,
        reading: allProgress.filter((p) => p > 0 && p < 100).length,
        completed: allProgress.filter((p) => p === 100).length,
        average_progress:
          total > 0
            ? Math.round(allProgress.reduce((sum, p) => sum + p, 0) / total)
            : 0,
      };

      return {
        success: true,
        data: {
          library: formattedLibrary,
          statistics: stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching user library:", error);
      return {
        success: false,
        message: "Gagal mengambil perpustakaan pengguna",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
