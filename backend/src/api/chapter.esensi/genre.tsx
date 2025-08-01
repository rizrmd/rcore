import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";
import { SeoTemplate } from "../../components/SeoTemplate";

export default defineAPI({
  name: "genre",
  url: "/genre/:slug",
  async handler() {
    const req = this.req!;
    const genre_slug = req?.params?.slug;
    
    if (!genre_slug) {
      return {
        jsx: null,
        data: null,
      };
    }

    // Parse query parameters from URL - same as browse API
    let page = 1;
    let tags: string[] = [];
    let minRating = 0;
    let sortBy = "newest";
    
    try {
      const urlParts = req.url.split("?");
      const queryString = urlParts.length > 1 ? urlParts[1] : "";
      const searchParams = new URLSearchParams(queryString);
      
      page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
      tags = searchParams.getAll("tags");
      minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : 0;
      sortBy = searchParams.get("sortBy") || "newest";
    } catch (error) {
      console.error("Error parsing query parameters:", error);
    }

    const books_per_page = 12;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;

    // Get genre info first
    const genre = await db.genre.findFirst({
      where: {
        slug: genre_slug,
        deleted_at: null,
      },
    });

    if (!genre) {
      return {
        jsx: null,
        data: null,
      };
    }

    // Build where clause for filtering - same as browse but with genre pre-filtered
    let whereClause: any = {
      status: BookStatus.PUBLISHED,
      deleted_at: null,
      is_chapter: true,
      // Always filter by genre
      book_genre: {
        some: {
          genre: {
            slug: genre_slug,
          },
        },
      },
    };

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
    // Commented out: rating_value field doesn't exist
    // if (minRating > 0) {
    //   whereClause.rating_value = {
    //     gte: minRating,
    //   };
    // }

    // Build order by clause - same as browse
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
              }
            },
            book_likes: true,
          }
        }
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

    // Get all genres for filter dropdown (excluding current)
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

    // Get all tags for suggestions - filtered by books in this genre
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
              book_genre: {
                some: {
                  genre: {
                    slug: genre_slug,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const data = {
      title: `Buku Genre ${genre.name}`,
      genre_info: {
        name: genre.name,
        slug: genre.slug,
      },
      books: books,
      genres: genres,
      tags: allTags,
      page: page,
      pages: total_pages,
      total_books: total_books,
      selected_genre: genre_slug,
      selected_tags: tags,
      min_rating: minRating,
      sort_by: sortBy,
    };

    const seo_data = {
      slug: `/genre/${genre_slug}${page > 1 ? `?page=${page}` : ``}`,
      page: page,
      meta_title: `Chapter Web Novel ${genre.name} Terbaik | Koleksi Cerita ${genre.name} di Esensi Online`,
      meta_description: `Temukan koleksi web novel ${genre.name} di Esensi Online. Baca cerita ${genre.name} yang seru, gratis, dan selalu update!`,
      image: "",
      headings: `Chapter Web Novel ${genre.name} di Esensi Online`,
      h2: `Rekomendasi Cerita ${genre.name} Terbaik`,
      h3: `Update Terbaru di Kategori ${genre.name}`,
      h4: `Jelajahi Cerita ${genre.name} Lainnya di Esensi Online`,
      paragraph: `Kategori ${genre.name} di Esensi Online menghadirkan cerita-cerita pilihan dengan tema ${genre.name}. Cocok untuk kamu yang suka ${genre.name}. Temukan web novel favoritmu di sini dan nikmati bacaan berkualitas setiap hari!`,
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
