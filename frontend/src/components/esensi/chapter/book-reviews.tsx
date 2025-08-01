import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi";
import { Star, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface BookReviewsProps {
  bookId: string;
}

export const BookReviews = ({ bookId }: BookReviewsProps) => {
  const local = useLocal({
    loading: false,
    reviews: [] as any[],
    stats: {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    currentPage: 1,
    totalPages: 1,
  }, async () => {
    if (!bookId) return;
    
    local.loading = true;
    local.render();
    
    try {
      const result = await api.book_reviews({ 
        bookId,
        page: local.currentPage,
        limit: 10
      });
      
      if (result) {
        local.reviews = result.reviews || [];
        local.stats = result.stats || local.stats;
        local.totalPages = result.totalPages || 1;
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      local.loading = false;
      local.render();
    }
  });

  const loadMore = async () => {
    if (local.currentPage >= local.totalPages) return;
    
    local.currentPage++;
    local.loading = true;
    local.render();
    
    try {
      const result = await api.book_reviews({ 
        bookId,
        page: local.currentPage,
        limit: 10
      });
      
      if (result && result.reviews) {
        local.reviews = [...local.reviews, ...result.reviews];
      }
    } catch (error) {
      console.error("Failed to load more reviews:", error);
      local.currentPage--;
    } finally {
      local.loading = false;
      local.render();
    }
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Rating & Ulasan</h3>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {local.stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.floor(local.stats.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {local.stats.totalReviews} ulasan
            </p>
          </div>
          
          <div className="flex-1">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = local.stats.ratingDistribution[rating as keyof typeof local.stats.ratingDistribution] || 0;
                const percentage = local.stats.totalReviews > 0 ? (count / local.stats.totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-3">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button className="bg-(--esensi-color) hover:opacity-90">
            Tulis Ulasan
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Ulasan Pembaca
        </h3>
        
        {local.loading && local.reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Memuat ulasan...</p>
          </div>
        ) : local.reviews.length > 0 ? (
          <div className="space-y-6">
            {local.reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {review.auth_user?.image ? (
                      <img
                        src={review.auth_user.image}
                        alt={review.auth_user.name || review.auth_user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {review.auth_user?.name || review.auth_user?.username || "Pengguna Anonim"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (review.rating ? Math.floor(Number(review.rating)) : 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {review.comments}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {local.currentPage < local.totalPages && (
              <div className="text-center pt-4">
                <Button
                  onClick={loadMore}
                  disabled={local.loading}
                  variant="outline"
                  className="hover:bg-gray-50"
                >
                  {local.loading ? "Memuat..." : "Tampilkan Lebih Banyak"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Belum ada ulasan. Jadilah yang pertama memberikan ulasan!</p>
            <Button className="bg-(--esensi-color) hover:opacity-90">
              Tulis Ulasan Pertama
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};