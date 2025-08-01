import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";
import { SeoTemplate } from "../../../components/SeoTemplate";

export default defineAPI({
  name: "tag",
  url: "/tag/:slug",
  async handler(options?: { query?: { page?: string; genre?: string; sortBy?: string; minRating?: string } }) {
    const req = this.req!;
    
    // Get tag slug from URL params
    const tagSlug = req.params?.slug || "";
    
    // Parse query parameters from URL - simplified like browse page
    let page = 1;
    let genre = "";
    let minRating = 0;
    let sortBy = "newest";
    
    try {
      const urlParts = req.url.split("?");
      const queryString = urlParts.length > 1 ? urlParts[1] : "";
      const searchParams = new URLSearchParams(queryString);
      
      page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
      genre = searchParams.get("genre") || "";
      minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : 0;
      sortBy = searchParams.get("sortBy") || "newest";
    } catch (error) {
      console.error("Error parsing query parameters:", error);
    }
    
    const books_per_page = 12;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;

    // Get tag information first
    const tag = await db.tags.findFirst({
      select: {
        name: true,
        slug: true,
      },
      where: {
        slug: tagSlug,
        deleted_at: null,
      },
    });

    if (!tag) {
      // Return simple 404-like response if tag not found
      const data = {
        title: `Tag Tidak Ditemukan`,
        books: [],
        genres: [],
        page: page,
        pages: 0,
        total_books: 0,
        selected_genre: genre,
        min_rating: minRating,
        sort_by: sortBy,
        tag: null,
      };

      const seo_data = {
        slug: `/tag/${tagSlug}`,
        meta_title: `Tag "${tagSlug}" Tidak Ditemukan | Esensi Online`,
        meta_description: `Tag "${tagSlug}" tidak ditemukan di Esensi Online. Coba cari tag lain atau jelajahi koleksi lengkap kami.`,
        image: ``,
        headings: `Tag "${tagSlug}" Tidak Ditemukan`,
        h2: `Tag yang Anda Cari Tidak Ada`,
        h3: `Jelajahi Tag Lainnya`,
        h4: `Kembali ke Halaman Utama`,
        h5: `Atau Coba Pencarian`,
        paragraph: `Maaf, tag "${tagSlug}" tidak ditemukan di koleksi Esensi Online. Mungkin tag tersebut telah dihapus atau tidak pernah ada. Silakan coba tag lainnya atau gunakan fitur pencarian untuk menemukan cerita yang Anda cari.`,
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
    }

    // Build where clause for filtering - simplified like browse page
    let whereClause: any = {
      status: BookStatus.PUBLISHED,
      deleted_at: null,
      is_chapter: true,
      book_tags: {
        some: {
          tags: {
            slug: tagSlug,
          },
        },
      },
    };

    // Add genre filter
    if (genre && genre !== "all") {
      whereClause.book_genre = {
        some: {
          genre: {
            slug: genre,
          },
        },
      };
    }

    // Add minimum rating filter
    // Commented out: rating_value field doesn't exist
    // if (minRating > 0) {
    //   whereClause.rating_value = {
    //     gte: minRating,
    //   };
    // }

    // Build order by clause
    let orderBy: any = { published_date: "desc" };
    switch (sortBy) {
      case "oldest":
        orderBy = { published_date: "asc" };
        break;
      // Commented out: rating_value field doesn't exist
      // case "rating_highest":
      //   orderBy = { rating_value: "desc" };
      //   break;
      // case "rating_lowest":
      //   orderBy = { rating_value: "asc" };
      //   break;
      case "title_asc":
        orderBy = { name: "asc" };
        break;
      case "title_desc":
        orderBy = { name: "desc" };
        break;
      case "chapters_most":
        orderBy = { total_chapters: "desc" };
        break;
      case "chapters_least":
        orderBy = { total_chapters: "asc" };
        break;
      default:
        orderBy = { published_date: "desc" };
    }

    const books = await db.book.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        submitted_price: true,
        cover: true,
        story_views: true,
        author: {
          select: {
            name: true,
          },
        },
        book_genre: {
          select: {
            genre: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            chapter: {
              where: {
                deleted_at: null,
                is_published: true,
              },
            },
            book_likes: true,
          },
        },
      },
      where: whereClause,
      orderBy: orderBy,
      skip: skip_books,
      take: books_per_page,
    });

    const total_books = await db.book.count({
      where: whereClause,
    });

    const total_pages = Math.ceil(total_books / books_per_page);

    // Get all genres for filter dropdown - same as browse page
    const genres = await db.genre.findMany({
      select: {
        name: true,
        slug: true,
      },
      where: {
        deleted_at: null,
        book_genre: {
          some: {
            book: {
              deleted_at: null,
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const data = {
      title: `Tag: ${tag.name}`,
      books: books,
      genres: genres,
      page: page,
      pages: total_pages,
      total_books: total_books,
      selected_genre: genre,
      min_rating: minRating,
      sort_by: sortBy,
      tag: tag,
    };

    const seo_data = {
      slug: `/tag/${tagSlug}`,
      meta_title: `Tag "${tag.name}" | Cerita dengan Tag ${tag.name} di Esensi Online`,
      meta_description: `Jelajahi semua cerita dengan tag "${tag.name}" di Esensi Online. Temukan web novel dan cerita menarik yang sesuai dengan minat Anda.`,
      image: ``,
      headings: `Cerita dengan Tag "${tag.name}"`,
      h2: `Jelajahi Cerita Bertag ${tag.name}`,
      h3: `Filter Berdasarkan Genre dan Rating`,
      h4: `Koleksi Terbaru Bertag ${tag.name}`,
      h5: `Temukan Cerita Favorit Anda`,
      paragraph: `Temukan semua cerita dengan tag "${tag.name}" di Esensi Online. Tag ini mencakup berbagai cerita menarik yang sesuai dengan tema ${tag.name}. Gunakan filter untuk mempersempit pilihan sesuai preferensi genre dan rating yang Anda inginkan.`,
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