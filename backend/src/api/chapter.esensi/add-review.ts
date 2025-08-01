import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "add_review",
  url: "/api/add-review",
  async handler(arg: { 
    bookId: string; 
    rating?: number; 
    comments: string; 
    userId: string;
  }) {
    // Validate input
    if (!arg.bookId || !arg.userId || !arg.comments) {
      return { error: "Missing required fields" };
    }

    // Rating is optional, but if provided, validate it
    if (arg.rating && (arg.rating < 1 || arg.rating > 5)) {
      return { error: "Rating must be between 1 and 5" };
    }

    try {
      // Check if user already reviewed this book
      const existingReview = await db.book_reviews.findFirst({
        where: {
          id_book: arg.bookId,
          id_user: arg.userId,
          deleted_at: null,
          parent: null,
        }
      });

      if (existingReview) {
        // Update existing review
        const updatedReview = await db.book_reviews.update({
          where: {
            id: existingReview.id,
          },
          data: {
            rating: arg.rating || null,
            comments: arg.comments,
          },
          include: {
            auth_user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              }
            }
          }
        });

        return { 
          success: true, 
          review: updatedReview,
          message: "Review updated successfully"
        };
      } else {
        // Create new review
        const newReview = await db.book_reviews.create({
          data: {
            id_book: arg.bookId,
            id_user: arg.userId,
            rating: arg.rating || null,
            comments: arg.comments,
            created_at: new Date(),
          },
          include: {
            auth_user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              }
            }
          }
        });

        return { 
          success: true, 
          review: newReview,
          message: "Review added successfully"
        };
      }
    } catch (error) {
      console.error("Error adding/updating review:", error);
      return { error: "Failed to add review" };
    }
  },
});