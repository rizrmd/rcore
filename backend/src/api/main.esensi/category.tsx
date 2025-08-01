import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";
import { ProductStatus } from "shared/types";

interface Product {
  id: string;
  cover: string;
  desc: string | null;
  currency: string;
  name: string;
  real_price: any;
  strike_price: any;
  slug: string;
  published_date: Date | null;
  is_physical: boolean;
  author: {
    id: string;
    name: string;
  } | null;
}

interface CategoryResponse {
  jsx: ReactElement;
  data: {
    title: string;
    list: Product[];
    pagination: {
      items: number;
      page: number;
      total_pages: number;
      url: {
        prefix: string;
        suffix: string;
      };
    };
    breadcrumb: Array<{
      url: string | null;
      label: string;
    }>;
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
  name: "category",
  url: "/category/:slug/:page",
  async handler(): Promise<CategoryResponse> {
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

    const cat_slug = req?.params.slug ? req.params.slug : ``;
    const cat = await db.category.findFirst({
      where: {
        slug: cat_slug,
        deleted_at: null,
      },
      include: {
        product_category: true,
      },
    });

    // Build where clause
    const whereClause: any = {
      id: {
        in: cat?.product_category?.map((x) => x.id_product),
      },
      status: ProductStatus.PUBLISHED,
      is_chapter: false,
      deleted_at: null,
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

    const products = await db.product.findMany({
      where: whereClause,
      select: {
        id: true,
        cover: true,
        desc: true,
        currency: true,
        name: true,
        real_price: true,
        strike_price: true,
        slug: true,
        published_date: true,
        is_physical: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip: skip_books,
      take: books_per_page,
      orderBy: orderBy,
    });

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
      title: `Semua Ebook tentang ${cat?.name}`,
      list: products,
      pagination: {
        items: books_per_page,
        page: page,
        total_pages: total_pages,
        url: {
          prefix: `/category/${req.params?.slug}`,
          suffix: paginationSuffix,
        },
      },
      breadcrumb: [
        {
          url: null,
          label: `${cat?.name}${page > 1 ? ` (page ${page})` : ""}`,
        },
      ],
      categories: availableCategories,
      authors: availableAuthors,
      banner_img: banner_file ? banner_file : null,
    };

    const seo_data = {
      slug: `/category/${req.params?.slug ? `${req.params.slug}` : ``}${
        page > 1 ? `/${page}` : ``
      }`,
      page: page,
      meta_title: `Ebook ${cat?.name} Terbaik | Unduh dan baca Ebook ${cat?.name}`,
      meta_description: `Lihat koleksi eBook kategori ${cat?.name}. Temukan bacaan berkualitas, update terbaru, dan pilihan eBook digital terbaik Indonesia.`,
      image: ``,
      headings: `Ebook ${cat?.name} Terbaik | Unduh dan baca Ebook ${cat?.name}`,
      paragraph: `Lihat koleksi eBook kategori ${cat?.name}. Temukan bacaan berkualitas, update terbaru, dan pilihan eBook digital terbaik Indonesia.`,
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
