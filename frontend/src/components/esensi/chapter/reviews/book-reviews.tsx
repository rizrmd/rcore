import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi";
import { User } from "lucide-react";
import React from "react";

interface BookReviewsProps {
  bookId: string;
}

export const BookReviews = ({ bookId }: BookReviewsProps) => {
  const local = useLocal(
    {
      reviews: [] as any[],
      totalReviews: 0,
      currentPage: 1,
      totalPages: 0,
      loading: true,
      reviewText: "",
    },
    async () => {
      await loadReviews();
    }
  );

  const loadReviews = async (page = 1) => {
    try {
      local.loading = true;
      local.render();
      
      const response = await api.book_reviews({ bookId, page, limit: 10 });
      
      if (response) {
        local.reviews = response.reviews || [];
        local.totalReviews = response.totalCount || 0;
        local.currentPage = response.currentPage || 1;
        local.totalPages = response.totalPages || 0;
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!local.reviewText.trim()) {
      alert("Harap tulis ulasan Anda.");
      return;
    }

    try {
      // Note: In a real app, you'd get the user ID from authentication
      const response = await api.add_review({
        bookId,
        comments: local.reviewText,
        userId: "current-user-id" // This should come from auth context
      });

      if (response.success) {
        // Reset form
        local.reviewText = "";
        local.render();
        
        // Reload reviews
        await loadReviews();
        
        alert(response.message || "Ulasan berhasil ditambahkan!");
      } else {
        alert(response.error || "Gagal menambahkan ulasan");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Terjadi kesalahan saat mengirim ulasan");
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (local.loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Ulasan Pembaca</h3>
      
      {/* Review Count */}
      {local.totalReviews > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {local.totalReviews} ulasan
          </p>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-4">Tulis Ulasan</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ulasan Anda</label>
            <textarea
              value={local.reviewText}
              onChange={(e) => {
                local.reviewText = e.target.value;
                local.render();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--esensi-color) focus:border-(--esensi-color) transition-all"
              rows={4}
              placeholder="Bagikan pendapat Anda tentang buku ini..."
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 bg-(--esensi-color) text-white rounded-full hover:opacity-90 transition-opacity font-medium"
          >
            Kirim Ulasan
          </button>
        </div>
      </form>

      {/* Reviews List */}
      <div className="space-y-4">
        {local.reviews.length > 0 ? (
          <>
            {local.reviews.map((review, index) => (
              <div key={review.id || index} className="p-6 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {review.auth_user?.image ? (
                      <img 
                        src={review.auth_user.image} 
                        alt={review.auth_user.name || review.auth_user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-semibold text-gray-900">
                        {review.auth_user?.name || review.auth_user?.username || 'Anonymous'}
                      </h5>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{review.comments}</p>
                    
                    <div className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {local.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: local.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => loadReviews(page)}
                    className={`px-4 py-2 rounded-lg ${
                      page === local.currentPage
                        ? 'bg-(--esensi-color) text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Belum ada ulasan. Jadilah yang pertama memberikan ulasan!
          </p>
        )}
      </div>
    </div>
  );
};