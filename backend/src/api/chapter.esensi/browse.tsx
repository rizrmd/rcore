import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";
import { SeoTemplate } from "../../components/SeoTemplate";

export default defineAPI({
  name: "browse",
  url: "/browse",
  async handler(options?: { query?: { page?: string; genre?: string; sortBy?: string } }) {
    const req = this.req!;
    
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
      
      page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
      genre = searchParams.get("genre") || "";
      category = searchParams.get("category") || "";
      tags = searchParams.getAll("tags");
      minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : 0;
      sortBy = searchParams.get("sortBy") || "newest";
    } catch (error) {
      console.error("Error parsing query parameters:", error);
    }
    const books_per_page = 12;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;
    
    console.log("Browse API - Page:", page, "Skip:", skip_books, "Take:", books_per_page);

    // Build where clause for filtering
    let whereClause: any = {
      status: BookStatus.PUBLISHED,
      deleted_at: null,
      is_chapter: true,
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

    // Get all categories for filter dropdown (simplified to avoid relationship errors)
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
      title: `Browse Books`,
      books: books,
      genres: genres,
      categories: categories,
      tags: allTags,
      page: page,
      pages: total_pages,
      total_books: total_books,
      selected_genre: genre,
      selected_category: category,
      selected_tags: tags,
      min_rating: minRating,
      sort_by: sortBy,
    };

    const seo_data = {
      slug: `/browse${page > 1 ? `/${page}` : ``}`,
      page: page,
      meta_title: `Katalog Chapter Web Novel Lengkap | Semua Judul Chapter Buku di Esensi Online`,
      meta_description: `Lihat seluruh koleksi judul web novel di Esensi Online. Temukan cerita favoritmu dari berbagai genre seperti fantasi, romantis, aksi, dan banyak lagi. Update setiap hari!`,
      image: ``,
      headings: `Katalog Chapter Lengkap Web Novel di Esensi Online`,
      h2: `Jelajahi Semua Judul Cerita dari Berbagai Genre`,
      h3: `Cari Berdasarkan Genre, Judul, atau Penulis`,
      h4: `Update Terbaru di Esensi Online`,
      h5: `Bergabunglah dengan Komunitas Pembaca Esensi Online`,
      paragraph: `Selamat datang di katalog lengkap Esensi Online! Di sini kamu bisa menjelajahi semua judul web novel yang tersedia—mulai dari kisah cinta yang mengharukan hingga petualangan epik penuh aksi. Gunakan fitur pencarian dan filter untuk menemukan cerita yang sesuai dengan seleramu. Koleksi kami diperbarui setiap hari untuk menghadirkan bacaan segar dan berkualitas.`,
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
