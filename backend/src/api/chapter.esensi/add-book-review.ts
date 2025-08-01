import { defineAPI } from "rlib/server";
import { utils } from "../../lib/better-auth";

export default defineAPI({
  name: "add_book_review",
  url: "/api/chapter/add-book-review",
  async handler(arg: { 
    bookId: string; 
    chapterId?: string; 
    comment: string; 
    rating?: number;
    paragraph?: number;
  }) {
    const req = this.req!;
    const sessionData = await utils.getSession(req.headers);
    
    // Check if user is logged in
    if (!sessionData?.user?.id) {
      return {
        success: false,
        error: "Anda harus login untuk menambahkan review"
      };
    }
    
    try {
      // Validate input
      if (!arg.bookId || !arg.comment || arg.comment.trim().length === 0) {
        return {
          success: false,
          error: "Review tidak boleh kosong"
        };
      }
      
      // Validate rating if provided
      if (arg.rating && (arg.rating < 1 || arg.rating > 5)) {
        return {
          success: false,
          error: "Rating harus antara 1-5"
        };
      }
      
      // Find customer by auth_user id
      const customer = await db.customer.findFirst({
        where: {
          auth_user: {
            id: sessionData.user.id
          }
        },
        select: {
          id: true
        }
      });
      
      if (!customer) {
        return {
          success: false,
          error: "Customer tidak ditemukan"
        };
      }
      
      // Create the review
      const review = await db.book_reviews.create({
        data: {
          id_book: arg.bookId,
          id_customer: customer.id,
          id_chapter: arg.chapterId || null,
          comments: arg.comment,
          rating: arg.rating || null,
          paragraph: arg.paragraph || null,
          created_at: new Date(),
        },
        include: {
          customer: {
            include: {
              auth_user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                }
              }
            }
          }
        }
      });
      
      // Fetch chapter info if chapterId was provided
      let chapter = null;
      if (review.id_chapter) {
        chapter = await db.chapter.findUnique({
          where: { id: review.id_chapter },
          select: {
            id: true,
            number: true,
            name: true,
          }
        });
      }
      
      return {
        success: true,
        review: {
          id: review.id,
          comment: review.comments,
          rating: review.rating ? Number(review.rating) : null,
          created_at: review.created_at,
          chapter: chapter,
          user: {
            id: review.customer.auth_user?.id || review.id_customer,
            name: review.customer.auth_user?.name || 'Anonymous',
            username: review.customer.auth_user?.username || null,
            avatar: review.customer.auth_user?.image || null,
          },
          likes: 0,
          userLiked: false,
          canEdit: true
        }
      };
    } catch (error) {
      console.error("Error adding book review:", error);
      return {
        success: false,
        error: "Gagal menambahkan review"
      };
    }
  },
});