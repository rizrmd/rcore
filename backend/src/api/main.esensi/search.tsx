import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";
import { ProductStatus } from "shared/types";
import banner from "./banner";

export default defineAPI({
  name: "search",
  url: "/search/:slug/:page",
  async handler() {
    const req = this.req!;

    const keyword = req.params?.slug ? decodeURI(req.params.slug) : "";

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
    let orderByProduct: any = { published_date: "desc" }; // default
    let orderByBundle: any = { created_at: "desc" }; // default

    switch (sortBy) {
      case "highest_price":
        orderByProduct = { real_price: "desc" };
        orderByBundle = { real_price: "desc" };
        break;
      case "lower_price":
        orderByProduct = { real_price: "asc" };
        orderByBundle = { real_price: "asc" };
        break;
      case "newest":
        orderByProduct = { published_date: "desc" };
        orderByBundle = { created_at: "desc" };
        break;
      case "oldest":
        orderByProduct = { published_date: "asc" };
        orderByBundle = { created_at: "asc" };
        break;
      default:
        orderByProduct = { published_date: "desc" };
        orderByBundle = { created_at: "desc" };
    }

    // Build where clause

    const whereClauseProduct: any = {
      OR: [
        { name: { contains: keyword, mode: "insensitive" } },
        { alias: { contains: keyword, mode: "insensitive" } },
      ],
      status: ProductStatus.PUBLISHED,
      deleted_at: null,
      is_chapter: false, // Exclude chapters
    };
    const whereClauseBundle: any = {
      name: {
        contains: keyword,
        mode: "insensitive",
      },
      status: ProductStatus.PUBLISHED,
      deleted_at: null,
    };

    // Add discount filter
    if (discountOnly) {
      whereClauseProduct.strike_price = { not: null };
      whereClauseBundle.strike_price = { not: null };
    }

    // Add category filter
    if (categories.length > 0) {
      whereClauseProduct.product_category = {
        some: {
          category: {
            slug: { in: categories },
          },
        },
      };

      whereClauseBundle.bundle_category = {
        some: {
          category: {
            slug: { in: categories },
          },
        },
      };
    }

    // Add author filter
    if (authors.length > 0) {
      whereClauseProduct.author = {
        id: { in: authors },
      };
    }

    const products_search = await db.product.findMany({
      select: {
        name: true,
        real_price: true,
        strike_price: true,
        slug: true,
        currency: true,
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
      where: whereClauseProduct,
      skip: skip_books,
      take: books_per_page,
      orderBy: orderByProduct,
    });

    const bundles_search = await db.bundle.findMany({
      select: {
        name: true,
        real_price: true,
        strike_price: true,
        slug: true,
        currency: true,
        cover: true,
        bundle_product: {
          select: {
            product: {
              select: {
                id: true,
                cover: true,
              },
            },
          },
        },
      },
      where: whereClauseBundle,
      skip: skip_books,
      take: books_per_page,
      orderBy: orderByBundle,
    });

    const products = [
      ...products_search.map((e) => ({
        ...e,
        type: "product",
      })),
      ...bundles_search.map((e) => ({
        ...e,
        type: "bundle",
      })),
    ];

    const count_products = await db.product.count({
      where: whereClauseProduct,
    });

    const count_bundles = await db.bundle.count({
      where: whereClauseBundle,
    });

    const count_both = count_products + count_bundles;
    const total_pages = Math.ceil(count_both / books_per_page);

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

    let trending = null;

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
      title: `Hasil pencarian buku dengan kata kunci ${keyword}`,
      list: products,
      pagination: {
        items: books_per_page,
        page: page,
        total_pages: total_pages,
        url: {
          prefix: `/search/${req.params?.slug}`,
          suffix: paginationSuffix,
        },
      },
      breadcrumb: [
        {
          url: "/search",
          label: `Pencarian`,
        },
        {
          url: null,
          label: keyword,
        },
      ],
      categories: availableCategories,
      authors: availableAuthors,
      trending: trending,
      banner_img: banner_file ? banner_file : null,
    };

    const seo_data = {
      slug: `/search${req.params?.slug ? `/${req.params.slug}` : `/_`}${
        page > 1 ? `/${page}` : ``
      }`,
      page: page,
      meta_title: `Hasil Pencarian untuk ebook ${keyword}`,
      meta_description: `Temukan eBook tentang ${keyword}. Temukan bacaan berkualitas, update terbaru, dan pilihan eBook digital terbaik Indonesia.`,
      image: ``,
      headings: `Hasil Pencarian untuk ebook ${keyword}`,
      paragraph: `Temukan eBook tentang ${keyword}. Temukan bacaan berkualitas, update terbaru, dan pilihan eBook digital terbaik Indonesia.`,
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
