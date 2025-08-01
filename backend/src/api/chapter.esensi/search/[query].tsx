import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";
import { SeoTemplate } from "../../../components/SeoTemplate";

export default defineAPI({
  name: "search",
  url: "/search/:query",
  async handler(options?: { query?: { page?: string; genre?: string; sortBy?: string } }) {
    const req = this.req!;
    
    // Get search query from URL params
    const searchQuery = req.params?.query ? decodeURIComponent(req.params.query) : "";
    
    // Parse query parameters from URL with enhanced filtering
    let page = 1;
    let genre = "";
    let category = "";
    let tags: string[] = [];
    let minRating = 0;
    let sortBy = "newest";
    
    try {
      const urlParts = req.url.split("?");
      const queryString = urlParts.length > 1 ? urlParts[1] : "";
      const searchParams = new URLSearchParams(queryString);
      
      // Debug logging
      console.log("Search API - Full URL:", req.url);
      console.log("Search API - Query string:", queryString);
      console.log("Search API - Search query from params:", searchQuery);
      
      page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
      genre = searchParams.get("genre") || "";
      category = searchParams.get("category") || "";
      tags = searchParams.getAll("tags");
      minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : 0;
      sortBy = searchParams.get("sortBy") || "newest";
      
      console.log("Search API - Parsed params:", { page, searchQuery, genre, category, tags, minRating, sortBy });
    } catch (error) {
      console.error("Error parsing query parameters:", error);
    }
    
    const books_per_page = 12;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;
    
    console.log("Search API - Page:", page, "Skip:", skip_books, "Take:", books_per_page);

    // Build where clause for filtering
    let whereClause: any = {
      status: BookStatus.PUBLISHED,
      deleted_at: null,
      is_chapter: true,
    };

    // Add search filter (mandatory for search page)
    if (searchQuery) {
      whereClause.OR = [
        {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          author: {
            name: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
        },
        {
          book_genre: {
            some: {
              genre: {
                name: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          book_tags: {
            some: {
              tags: {
                name: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      ];
    }

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

    // Add category filter
    if (category && category !== "all") {
      whereClause.book_category = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    // Add tags filter
    if (tags.length > 0) {
      whereClause.book_tag = {
        some: {
          tag: {
            slug: {
              in: tags,
            },
          },
        },
      };
    }

    // Add minimum rating filter
    // TODO: Implement rating filter using book_reviews aggregation
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
      case "rating_highest":
        // TODO: Implement sorting by average rating from book_reviews
        orderBy = { published_date: "desc" };
        break;
      case "rating_lowest":
        // TODO: Implement sorting by average rating from book_reviews
        orderBy = { published_date: "desc" };
        break;
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
      case "relevance":
        // For relevance, we prioritize exact title matches first
        orderBy = [
          { published_date: "desc" }, // fallback to newest
        ];
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
        book_tags: {
          select: {
            tags: {
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

    // Get all genres for filter dropdown
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

    // Get all categories for filter dropdown
    const categories = await db.category.findMany({
      select: {
        name: true,
        slug: true,
      },
      where: {
        deleted_at: null,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get all tags for suggestions
    const allTags = await db.tags.findMany({
      select: {
        name: true,
        slug: true,
      },
      where: {
        deleted_at: null,
        book_tags: {
          some: {
            book: {
              status: BookStatus.PUBLISHED,
              deleted_at: null,
              is_chapter: true,
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const data = {
      title: `Pencarian: ${searchQuery || 'Semua Buku'}`,
      books: books,
      genres: genres,
      categories: categories,
      tags: allTags,
      page: page,
      pages: total_pages,
      total_books: total_books,
      search: searchQuery,
      selected_genre: genre,
      selected_category: category,
      selected_tags: tags,
      min_rating: minRating,
      sort_by: sortBy,
    };

    const seo_data = {
      slug: `/search${page > 1 ? `/${page}` : ``}`,
      page: page,
      meta_title: `Hasil Pencarian "${searchQuery}" | Esensi Online`,
      meta_description: `Temukan hasil pencarian untuk "${searchQuery}" di Esensi Online. Jelajahi web novel dan cerita dari berbagai genre sesuai dengan kata kunci pencarian Anda.`,
      image: ``,
      headings: `Hasil Pencarian "${searchQuery}"`,
      h2: `Temukan Cerita Sesuai Pencarian Anda`,
      h3: `Filter Berdasarkan Genre dan Rating`,
      h4: `Hasil Pencarian Terbaru`,
      h5: `Tidak Menemukan yang Dicari?`,
      paragraph: `Hasil pencarian untuk "${searchQuery}" di Esensi Online. Kami menampilkan semua cerita yang relevan dengan kata kunci pencarian Anda. Gunakan filter tambahan untuk mempersempit hasil pencarian sesuai preferensi Anda. Jika tidak menemukan yang dicari, coba gunakan kata kunci yang berbeda atau jelajahi koleksi lengkap kami.`,
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
