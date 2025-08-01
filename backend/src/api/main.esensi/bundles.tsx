import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";
import { ProductStatus } from "shared/types";

interface BundleItem {
  id: string;
  name: string;
  slug: string;
  cover: string;
  real_price: any;
  strike_price: any;
  currency: string;
  status: string;
  created_at: Date | null;
  bundle_product: Array<{
    product: {
      name: string;
      slug: string;
      cover: string;
      strike_price: any;
      real_price: any;
      currency: string;
      product_file: string | null;
    };
  }>;
  author: {
    id: string;
    name: string;
  } | null;
}

interface BundlesResponse {
  jsx: ReactElement;
  data: {
    title: string;
    list: BundleItem[];
    breadcrumb: Array<{
      url: string | null;
      label: string;
    }>;
    pagination: {
      items: number;
      page: number;
      total_pages: number;
      url: {
        prefix: string;
        suffix: string;
      };
    };
    categories: Array<{
      name: string;
      slug: string | null;
    }>;
    authors: Array<{
      id: string;
      name: string;
    }>;
    banner_img?: string | null;
  };
}

export default defineAPI({
  name: "bundles",
  url: "/bundles/:page",
  async handler(): Promise<BundlesResponse> {
    const req = this.req!;

    // Get query parameters from URL
    let sortBy = null;
    let categories: string[] = [];
    let authors: string[] = [];
    let discountOnly = false;
    let rating = null;

    try {
      const urlParts = req.url.split("?");
      const queryString = urlParts.length > 1 ? urlParts[1] : "";
      const searchParams = new URLSearchParams(queryString);

      sortBy = searchParams.get("sort");
      categories = searchParams.getAll("categories");
      authors = searchParams.getAll("authors");
      discountOnly = searchParams.get("discount") === "discounted";
      rating = searchParams.get("rating")
        ? parseInt(searchParams.get("rating")!)
        : null;
    } catch (error) {
      console.error("Error parsing query parameters:", error);
    }

    const page = req.params?.page ? parseInt(req.params.page) : 1;
    const books_per_page = 20;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;

    // Build orderBy clause
    let orderBy: any = { created_at: "desc" }; // default

    switch (sortBy) {
      case "highest_price":
        orderBy = { real_price: "desc" };
        break;
      case "lower_price":
        orderBy = { real_price: "asc" };
        break;
      case "newest":
        orderBy = { created_at: "desc" };
        break;
      case "oldest":
        orderBy = { created_at: "asc" };
        break;
      default:
        orderBy = { created_at: "desc" };
    }

    // Build where clause
    const whereClause: any = {
      status: ProductStatus.PUBLISHED,
      deleted_at: null,
    };

    // Add discount filter
    if (discountOnly) {
      whereClause.strike_price = { not: null };
    }

    // Add category filter
    if (categories.length > 0) {
      whereClause.bundle_category = {
        some: {
          category: {
            slug: { in: categories },
          },
        },
      };
    }

    // Add author filter
    if (authors.length > 0) {
      whereClause.author = {
        id: { in: authors },
      };
    }

    const products = await db.bundle.findMany({
      include: {
        bundle_product: {
          select: {
            product: {
              select: {
                name: true,
                slug: true,
                cover: true,
                strike_price: true,
                real_price: true,
                currency: true,
                product_file: true,
                is_physical: true,
              },
            },
          },
          where: {
            product: {
              status: ProductStatus.PUBLISHED,
              deleted_at: null,
              is_chapter: false,
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: whereClause,
      orderBy: orderBy,
      skip: skip_books,
      take: books_per_page,
    });

    const total_pages = Math.ceil(
      (await db.bundle.count({
        where: whereClause,
      })) / books_per_page
    );

    // Get available categories and authors for filter
    const availableCategories = await db.category.findMany({
      select: {
        name: true,
        slug: true,
      },
      where: {
        deleted_at: null,
        id_parent: null,
        other_category: { every: { id_parent: null } },
      },
    });

    const availableAuthors = await db.author.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        product: {
          some: {
            status: ProductStatus.PUBLISHED,
            deleted_at: null,
          },
        },
      },
    });

    // Build query string for pagination URLs
    const queryParams = new URLSearchParams();
    if (sortBy) queryParams.set("sort", sortBy);
    if (categories.length > 0) {
      categories.forEach((cat) => queryParams.append("categories", cat));
    }
    if (authors.length > 0) {
      authors.forEach((author) => queryParams.append("authors", author));
    }
    if (discountOnly) queryParams.set("discount", "discounted");
    if (rating) queryParams.set("rating", rating.toString());

    const queryString = queryParams.toString();
    const paginationSuffix = queryString ? `?${queryString}` : "";

    // Get banner img
    const getBanner = await db.banner.findFirst({
      select: {
        banner_file: true,
      },
      where: {
        title: `banner-booklist`,
        deleted_at: null,
      },
    });

    const the_files =
      getBanner !== null ? JSON.parse(getBanner.banner_file as string) : [];
    const multiple_files = the_files.length > 1 ? true : false;
    const banner_file = multiple_files ? the_files : the_files[0];

    const data = {
      title: `Lihat Semua Ebook`,
      list: products,
      breadcrumb: [
        {
          url: null,
          label: `Bundle Hemat`,
        },
      ],
      pagination: {
        items: books_per_page,
        page: page,
        total_pages: total_pages,
        url: {
          prefix: "/bundles",
          suffix: paginationSuffix,
        },
      },
      categories: availableCategories,
      authors: availableAuthors,
      banner_img: banner_file ? banner_file : null,
    };

    const seo_data = {
      slug: `/bundles${page > 1 ? `/${page}` : ``}`,
      page: page,
      meta_title: `Bundle ebook hemat | Paket spesial lebih lengkap lebih murah`,
      meta_description: `Beli bundle eBook lebih hemat! Temukan pilihan eBook terbaik dalam satu paket dengan harga lebih terjangkau.`,
      image: ``,
      headings: `Bundle ebook hemat | Paket spesial lebih lengkap lebih murah`,
      paragraph: `Beli bundle eBook lebih hemat! Temukan pilihan eBook terbaik dalam satu paket dengan harga lebih terjangkau.`,
      is_product: false,
    };

    return {
      jsx: (
        <>
          <SeoTemplate data={seo_data} />
        </>
      ),
      data: data,
    };
  },
});
