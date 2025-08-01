import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";
import { ProductStatus } from "shared/types";

interface Ebook {
  name: string;
  slug: string;
  currency: string;
  real_price: any;
  strike_price: any;
  cover: string | null;
  published_date: Date | null;
  is_physical: boolean;
  author: {
    id: string;
    name: string;
  } | null;
}

interface EbookResponse {
  jsx: ReactElement;
  data: {
    title: string;
    list: Ebook[];
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
  name: "ebook",
  url: "/ebook/:page",
  async handler(): Promise<any> {
    const req = this.req!;

    // Get query parameters from URL
    let sortBy = null;
    let categories: string[] = [];
    let authors: string[] = [];
    let discountOnly = false;
    let rating = null;
    let minPrice = null;
    let maxPrice = null;

    try {
      const urlParts = req.url.split("?");
      const queryString = urlParts.length > 1 ? urlParts[1] : "";

      const searchParams = new URLSearchParams(queryString);

      // Debug logging
      console.log("Ebook API - Full URL:", req.url);
      console.log("Ebook API - Query string:", queryString);

      sortBy = searchParams.get("sort");
      categories = searchParams.getAll("categories");
      authors = searchParams.getAll("authors");
      discountOnly = searchParams.get("discount") === "discounted";
      rating = searchParams.get("rating")
        ? parseInt(searchParams.get("rating")!)
        : null;
      minPrice = searchParams.get("min_price")
        ? parseInt(searchParams.get("min_price")!)
        : null;
      maxPrice = searchParams.get("max_price")
        ? parseInt(searchParams.get("max_price")!)
        : null;

      // Debug logging
      console.log("Ebook API - Parsed filters:", {
        sortBy,
        categories,
        authors,
        discountOnly,
        rating,
        minPrice,
        maxPrice,
      });
    } catch (error) {
      console.error("Error parsing query parameters:", error);
    }

    const page = req.params?.page ? parseInt(req.params.page) : 1;
    const books_per_page = 20;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;

    // Build orderBy clause
    let orderBy: any = { published_date: "desc" }; // default

    switch (sortBy) {
      case "highest_price":
        orderBy = { real_price: "desc" };
        break;
      case "lower_price":
        orderBy = { real_price: "asc" };
        break;
      case "newest":
        orderBy = { published_date: "desc" };
        break;
      case "oldest":
        orderBy = { published_date: "asc" };
        break;
      default:
        orderBy = { published_date: "desc" };
    }

    // Build where clause
    const whereClause: any = {
      status: ProductStatus.PUBLISHED,
      deleted_at: null,
      is_chapter: false, // Exclude chapters
      is_physical: false,
    };

    // Add discount filter
    if (discountOnly) {
      whereClause.strike_price = { not: null };
    }

    // Add category filter
    if (categories.length > 0) {
      whereClause.product_category = {
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

    // Add price range filter
    if (minPrice !== null || maxPrice !== null) {
      whereClause.real_price = {};
      if (minPrice !== null) {
        whereClause.real_price.gte = minPrice;
      }
      if (maxPrice !== null) {
        whereClause.real_price.lte = maxPrice;
      }
    }

    // Add rating filter (this would require a rating table/field)
    // For now, we'll skip this as it requires database schema changes
    // if (rating !== null) {
    //   whereClause.rating = { gte: rating };
    // }

    // Debug logging
    console.log(
      "Ebook API - Final whereClause:",
      JSON.stringify(whereClause, null, 2)
    );
    console.log("Ebook API - Final orderBy:", JSON.stringify(orderBy, null, 2));

    const products = await db.product.findMany({
      select: {
        name: true,
        slug: true,
        currency: true,
        real_price: true,
        strike_price: true,
        cover: true,
        published_date: true,
        is_physical: true,
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

    // Debug logging
    console.log(`Ebook API - Found ${products.length} products`);
    console.log(
      `Ebook API - Page ${page}, Skip ${skip_books}, Take ${books_per_page}`
    );

    const total_pages = Math.ceil(
      (await db.product.count({
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
    if (minPrice) queryParams.set("min_price", minPrice.toString());
    if (maxPrice) queryParams.set("max_price", maxPrice.toString());

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
      title: `Semua Ebook`,
      list: products,
      breadcrumb: [
        {
          url: null,
          label: `Semua Ebook`,
        },
      ],
      pagination: {
        items: books_per_page,
        page: page,
        total_pages: total_pages,
        url: {
          prefix: "/ebook",
          suffix: "",
        },
      },
      categories: availableCategories,
      authors: availableAuthors,
      banner_img: banner_file ? banner_file : null,
    };

    const seo_data = {
      slug: `/ebook${page > 1 ? `/${page}` : ``}`,
      page: page,
      meta_title: `Temukan Ribuan Judul Ebook Terbaik Indonesia | Esensi Online`,
      meta_description: `Lihat semua koleksi eBook terbaik Indonesia. Temukan bacaan favorit Anda dan beli eBook berkualitas dengan harga terjangkau hanya di toko kami.`,
      image: ``,
      headings: `Temukan Ribuan Judul Ebook Terbaik Indonesia | Esensi Online`,
      paragraph: `Lihat semua koleksi eBook terbaik Indonesia. Temukan bacaan favorit Anda dan beli eBook berkualitas dengan harga terjangkau hanya di toko kami.`,
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
