import { defineAPI } from "rlib/server";
import { utils } from "../../lib/better-auth";

export default defineAPI({
  name: "book_reviews",
  url: "/api/book-reviews/:bookId",
  async handler(arg: { bookId: string; chapterId?: string; page?: number; limit?: number }) {
    const req = this.req!;
    const sessionData = await utils.getSession(req.headers);
    
    const bookId = arg.bookId;
    const chapterId = arg.chapterId;
    const page = arg.page || 1;
    const limit = arg.limit || 10;
    const skip = (page - 1) * limit;

    // Validate bookId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!bookId || !uuidRegex.test(bookId)) {
      return {
        error: "Invalid book ID",
        reviews: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        }
      };
    }

    const whereClause: any = {
      id_book: bookId,
      deleted_at: null,
      parent: null,
    };
    
    // If chapterId is provided, filter by chapter
    if (chapterId) {
      whereClause.id_chapter = chapterId;
    }

    const reviews = await db.book_reviews.findMany({
      where: whereClause,
      include: {
        customer: {
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
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: limit,
    });

    const totalCount = await db.book_reviews.count({
      where: whereClause
    });

    const stats = await db.book_reviews.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
      where: whereClause,
    });

    const ratingDistribution = await db.book_reviews.groupBy({
      by: ['rating'],
      _count: {
        rating: true,
      },
      where: {
        ...whereClause,
        rating: {
          not: null,
        },
      },
    });

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingDistribution.forEach(item => {
      const rating = Math.floor(Number(item.rating));
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution] = item._count.rating;
      }
    });

    // Get chapter info for reviews that have chapter IDs
    const chapterIds = reviews
      .filter(r => r.id_chapter)
      .map(r => r.id_chapter as string);
    
    let chaptersMap = new Map();
    if (chapterIds.length > 0) {
      const chapters = await db.chapter.findMany({
        where: {
          id: { in: chapterIds }
        },
        select: {
          id: true,
          number: true,
          name: true,
        }
      });
      chaptersMap = new Map(chapters.map(ch => [ch.id, ch]));
    }

    // Get current customer info if user is logged in
    let currentCustomer = null;
    if (sessionData?.user?.id) {
      currentCustomer = await db.customer.findFirst({
        where: {
          auth_user: {
            id: sessionData.user.id
          }
        },
        select: { id: true }
      });
    }

    // Transform reviews to include user info and likes
    const transformedReviews = reviews.map(review => {
      // For now, set likes to 0 and userLiked to false until we fix the reviews_likes table structure
      const userLiked = false;
      
      return {
        id: review.id,
        comment: review.comments,
        rating: review.rating ? Number(review.rating) : null,
        created_at: review.created_at,
        chapter: review.id_chapter ? chaptersMap.get(review.id_chapter) : null,
        user: {
          id: review.customer.auth_user?.id || review.id_customer,
          name: review.customer.auth_user?.name || 'Anonymous',
          username: review.customer.auth_user?.username || null,
          avatar: review.customer.auth_user?.image || null,
        },
        likes: 0,
        userLiked: userLiked,
        canEdit: currentCustomer?.id === review.id_customer
      };
    });

    return {
      reviews: transformedReviews,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      stats: {
        averageRating: stats._avg.rating ? Number(stats._avg.rating) : 0,
        totalReviews: stats._count.id,
        ratingDistribution: distribution,
      },
      isLoggedIn: !!sessionData?.user
    };
  },
});