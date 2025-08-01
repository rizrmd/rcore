import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "next_chapter",
  url: "/api/chapter/next-chapter",
  async handler(arg: { id_book: string; current_chapter_number: number; id_user?: string }) {
    try {
      // Find the next chapter with a higher number in the same book
      const nextChapter = await db.chapter.findFirst({
        where: {
          id_book: arg.id_book,
          number: {
            gt: arg.current_chapter_number
          },
          is_published: true,
          deleted_at: null
        },
        select: {
          id: true,
          number: true,
          name: true,
          slug: true,
          content: true,
          word_count: true,
          created_at: true,
          coin_price: true,
          is_monetized: true
        },
        orderBy: {
          number: 'asc'
        }
      });

      if (!nextChapter) {
        return {
          success: true,
          data: null,
          message: "No more chapters available"
        };
      }

      // Check if the user has access to this chapter
      let hasAccess = false;
      if (arg.id_user && nextChapter.is_monetized && nextChapter.coin_price > 0) {
        // Find customer by user ID
        const customer = await db.customer.findFirst({
          where: {
            auth_user: {
              id: arg.id_user
            }
          },
          select: {
            id: true
          }
        });

        if (customer) {
          // Check if customer has already unlocked this chapter
          const chapterReader = await db.chapter_reader.findFirst({
            where: {
              id_customer: customer.id,
              id_chapter: nextChapter.id
            }
          });
          hasAccess = !!chapterReader;
        }
      } else {
        // Chapter is free or user is not authenticated
        hasAccess = !nextChapter.is_monetized || nextChapter.coin_price === 0;
      }

      // Also get the book info for slug
      const book = await db.book.findUnique({
        where: { id: arg.id_book },
        select: {
          slug: true,
          name: true
        }
      });

      return {
        success: true,
        data: {
          chapter: {
            ...nextChapter,
            hasAccess: hasAccess
          },
          book: book
        }
      };
    } catch (error) {
      console.error("Error fetching next chapter:", error);
      return {
        success: false,
        message: "Failed to fetch next chapter"
      };
    }
  },
});