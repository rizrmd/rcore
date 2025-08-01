import { SeoTemplate } from "../../components/SeoTemplate";
import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";

export default defineAPI({
  name: "title",
  url: "/title/:slug",
  async handler(arg?: { userId?: string }) {
    const req = this.req!;
    const userId = arg?.userId; // User ID from authentication context

    // Find customer ID from user ID
    let customerId: string | null = null;
    if (userId) {
      const user = await db.auth_user.findUnique({
        where: { id: userId },
        select: { id_customer: true }
      });
      customerId = user?.id_customer || null;
    }

    // if slug == "_" redirect to /browse

    const book = await db.book.findFirst({
      where: {
        slug: req.params.slug,
        status: BookStatus.PUBLISHED,
        is_chapter: true,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        cover: true,
        desc: true,
        currency: true,
        submitted_price: true,
        published_date: true,
        story_views: true,
        is_completed: true,
        id_author: true,
        info: true,
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
      }
    });

    const genres = await db.book_genre.findMany({
      where: {
        id_book: book?.id,
      },
      include: {
        genre: true,
      },
    });

    const genres_name = genres.map((g) => {
      return `, ${g.genre.name}`;
    });

    const tags = await db.book_tags.findMany({
      where: {
        id_book: book?.id,
      },
      include: {
        tags: true,
      },
    });

    const author = await db.author.findFirst({
      select: {
        id: true,
        name: true,
        slug: true,
        avatar: true,
        biography: true,
      },
      where: book?.id_author ? {
        id: book.id_author,
      } : undefined,
    });

    const chaptersRaw = await db.chapter.findMany({
      where: {
        id_book: book?.id,
        deleted_at: null,
        is_published: true,
      },
      orderBy: {
        number: `asc`,
      },
      select: {
        id: true,
        number: true,
        name: true,
        slug: true,
        created_at: true,
        updated_at: true,
        word_count: true,
        coin_price: true,
      },
    });

    const chapters = chaptersRaw;

    // Check user-specific data if user is logged in
    let userProgress = null;
    let userHasLiked = false;

    if (book?.id) {
      // Check if customer has read any chapter of this book
      if (customerId) {
        const readingProgress = await db.chapter_reader.findFirst({
          where: {
            id_customer: customerId,
            chapter: {
              id_book: book.id,
              deleted_at: null,
              is_published: true,
            }
          },
          include: {
            chapter: {
              select: {
                id: true,
                number: true,
                name: true,
              }
            }
          },
          orderBy: {
            last_read: 'desc'
          }
        });

        userProgress = readingProgress;
      }

      // Check if user has liked this book
      if (userId) {
        const userLike = await db.book_likes.findFirst({
          where: {
            id_user: userId,
            id_book: book.id,
          }
        });

        userHasLiked = !!userLike;
      }
    }

    const data = {
      title: `Detail Ebook`,
      book: book,
      chapters: chapters,
      author: author,
      genres: genres,
      tags: tags,
      userProgress: userProgress,
      userHasLiked: userHasLiked,
      content: ``,
    };

    const seo_data = {
      slug: `/title/${req.params.slug}`,
      meta_title: `${book?.name} - Chapter Web Novel oleh ${book?.info} | Esensi Online`,
      meta_description: `Baca ${book?.name} karya ${book?.info} di Esensi Online. Cerita ${genres_name} dengan alur yang menarik dan karakter yang kuat. Update secara berkala & gratis dibaca!`,
      image: `${book?.cover}`,
      headings: `${book?.name} oleh ${book?.info}`,
      paragraph: `${book?.desc}`,
      keywords: `${genres_name}`,
      is_product: true,
      price: book?.submitted_price,
      currencry: book?.currency,
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
