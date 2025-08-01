import { List, MessageSquare, Gift, ThumbsUp, Lock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatThousands } from "@/lib/utils";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi";
import { Link } from "@/lib/router";
import { GiftModal } from "@/components/esensi/chapter/gift-modal";
import { RechargeCoinsModal } from "@/components/esensi/chapter/recharge-coins-modal";
import { giftModalState } from "@/lib/states/gift-modal-state";
import { betterAuth } from "@/lib/better-auth";
import { UnlockChapterModal } from "@/components/esensi/chapter/unlock-chapter-modal";

interface ChapterSideNavbarProps {
  bookSlug: string;
  chapterNumber: string;
  chapterSlug: string;
  bookId?: string;
  chapterId?: string;
}

export function ChapterSideNavbar({ bookSlug, chapterNumber, chapterSlug, bookId, chapterId }: ChapterSideNavbarProps) {
  const local = useLocal({
    showChapterList: false,
    showReviewModal: false,
    showReviewsDrawer: false,
    chapters: [] as any[],
    loadingChapters: false,
    reviews: [] as any[],
    loadingReviews: false,
    reviewText: '',
    reviewRating: 0,
    submittingReview: false,
    isLoggedIn: false,
    checkingAuth: true,
    unlockModalOpen: false,
    selectedChapter: null as any
  }, async () => {
    // Check auth status on mount
    try {
      const session = await betterAuth.getSession();
      local.isLoggedIn = !!session?.data?.user;
    } catch (error) {
      local.isLoggedIn = false;
    } finally {
      local.checkingAuth = false;
      local.render();
    }
  });

  // Function to format relative date (copied from title page)
  const formatRelativeDate = (dateString: string, type: 'updated' | 'published') => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    let relativeText = '';
    if (diffInYears > 0) {
      relativeText = `${diffInYears} tahun yang lalu`;
    } else if (diffInMonths > 0) {
      relativeText = `${diffInMonths} bulan yang lalu`;
    } else if (diffInDays > 0) {
      relativeText = `${diffInDays} hari yang lalu`;
    } else {
      relativeText = 'Hari ini';
    }

    const prefix = type === 'updated' ? 'Diperbarui' : 'Diterbitkan';
    const readableDate = date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      text: `${prefix} ${relativeText}`,
      title: readableDate
    };
  };

  // Function to format word count (copied from title page)
  const formatWordCount = (count: number) => {
    if (!count) return '0 kata';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k kata`;
    }
    return `${count} kata`;
  };

  const handleChapterList = async () => {
    // Toggle the chapter list
    local.showChapterList = !local.showChapterList;
    
    // Only load chapters if opening and haven't loaded yet
    if (local.showChapterList && local.chapters.length === 0 && !local.loadingChapters) {
      local.loadingChapters = true;
      local.render();
      
      try {
        const res = await api.title({ slug: bookSlug });
        if (res?.data?.chapters) {
          // Clear any existing chapters first to prevent duplicates
          local.chapters = [];
          // Add the new chapters
          local.chapters = res.data.chapters;
        }
      } catch (error) {
        console.error("Failed to load chapters:", error);
      } finally {
        local.loadingChapters = false;
        local.render();
      }
    } else {
      local.render();
    }
  };

  const handleReview = async () => {
    if (!local.isLoggedIn) {
      alert('Anda harus login untuk menambahkan review');
      // Optionally redirect to login page
      // window.location.href = '/login';
      return;
    }
    local.showReviewModal = true;
    local.render();
  };

  const handleShowReviews = async () => {
    // Toggle the reviews drawer
    local.showReviewsDrawer = !local.showReviewsDrawer;
    
    // Only load reviews if opening and haven't loaded yet
    if (local.showReviewsDrawer && local.reviews.length === 0 && !local.loadingReviews && bookId) {
      local.loadingReviews = true;
      local.render();
      
      try {
        const res = await api.book_reviews({ 
          bookId: bookId,
          chapterId: chapterId,
          limit: 20 
        });
        
        if (res?.reviews) {
          local.reviews = res.reviews;
        }
      } catch (error) {
        console.error("Failed to load reviews:", error);
      } finally {
        local.loadingReviews = false;
        local.render();
      }
    } else {
      local.render();
    }
  };

  const handleGift = () => {
    giftModalState.write.isOpen = true;
  };
  
  const handleSubmitReview = async () => {
    if (!local.reviewText.trim() || !bookId) return;
    
    local.submittingReview = true;
    local.render();
    
    try {
      const res = await api.add_book_review({
        bookId: bookId,
        chapterId: chapterId,
        comment: local.reviewText,
        rating: local.reviewRating > 0 ? local.reviewRating : undefined
      });
      
      if (res?.success && res.review) {
        // Add the new review to the beginning of the list
        local.reviews.unshift(res.review);
        local.reviewText = '';
        local.reviewRating = 0;
        local.showReviewModal = false;
        local.render();
      } else {
        alert(res?.error || 'Gagal menambahkan review');
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert('Gagal menambahkan review');
    } finally {
      local.submittingReview = false;
      local.render();
    }
  };

  return (
    <>
      <aside className="fixed md:left-4 md:top-1/2 md:-translate-y-1/2 bottom-0 left-0 right-0 md:bottom-auto md:right-auto z-40 bg-white md:rounded-full shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:shadow-lg border-t md:border md:border-t-0 md:p-2 p-0">
        <div className="flex md:flex-col flex-row justify-around md:justify-start items-center md:gap-3 gap-0 px-2 md:px-0 py-2 md:py-0">
          {/* Chapter List */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-100 w-12 h-12"
            onClick={handleChapterList}
            title="Daftar Chapter"
          >
            <List className="h-5 w-5 text-gray-600" />
          </Button>
          
          {/* Show Reviews */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-100 w-12 h-12"
            onClick={handleShowReviews}
            title="Lihat Review"
          >
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </Button>
          
          {/* Send Gift */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-100 w-12 h-12"
            onClick={handleGift}
            title="Kirim Hadiah"
          >
            <Gift className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </aside>
      
      {/* Chapter List Drawer */}
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black z-[60] transition-opacity duration-300 ease-in-out",
          local.showChapterList ? "opacity-50 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => {
          local.showChapterList = false;
          local.render();
        }}
      />
      
      {/* Drawer */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-[70] transform transition-transform duration-300 ease-in-out overflow-hidden",
        local.showChapterList ? "translate-x-0" : "-translate-x-full"
      )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Daftar Chapter</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  local.showChapterList = false;
                  local.render();
                }}
              >
                ✕
              </Button>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4">
              {local.loadingChapters ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-500">Memuat chapter...</div>
                </div>
              ) : local.chapters.length > 0 ? (
                <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  {/* Remove duplicates based on chapter number */}
                  {Array.from(new Map(local.chapters.map((ch: any) => [ch.number, ch])).values()).map((chapter: any, index: number) => {
                    const isCurrentChapter = chapter.number.toString() === chapterNumber;
                    const isLocked = chapter.number > 10 && chapter.coin_price > 0;
                    
                    // Use slug from database
                    const chapterSlugUrl = chapter.slug;
                    
                    if (!chapterSlugUrl) {
                      console.warn("Chapter missing slug:", chapter);
                      return null; // Skip chapters without slugs
                    }
                    
                    return isLocked ? (
                      <div
                        key={chapter.id || index}
                        className="relative block p-3 border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                      >
                        {/* Lock overlay */}
                        <div className="absolute inset-0 bg-gray-100 opacity-50 z-10"></div>
                        
                        <div className="relative z-20">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  Chapter {chapter.number}: {chapter.name}
                                </p>
                                <Lock className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-gray-500">
                                  {formatWordCount(chapter.word_count || 0)}
                                </p>
                                {(chapter.updated_at || chapter.created_at) && (() => {
                                  const dateInfo = formatRelativeDate(
                                    chapter.updated_at || chapter.created_at,
                                    chapter.updated_at ? 'updated' : 'published'
                                  );
                                  return (
                                    <span title={dateInfo.title} className="text-xs text-gray-500">
                                      {new Date(chapter.updated_at || chapter.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                            
                            {/* Unlock button */}
                            <button 
                              className="flex items-center gap-1 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-xs font-medium transition-colors cursor-pointer z-30"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                local.unlockModalOpen = true;
                                local.selectedChapter = chapter;
                                local.render();
                              }}
                            >
                              <Coins className="w-3 h-3" />
                              <span>{chapter.coin_price || 0} Buka</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : isCurrentChapter ? (
                      // For current chapter, just show a div that closes the drawer
                      <div
                        key={chapter.id || index}
                        className={cn(
                          "block p-3 rounded-lg transition-all duration-200 border cursor-pointer",
                          "bg-blue-50 border-blue-300 shadow-sm"
                        )}
                        onClick={() => {
                          local.showChapterList = false;
                          local.render();
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-700">
                              Chapter {chapter.number}: {chapter.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-500">
                                {formatWordCount(chapter.word_count || 0)}
                              </p>
                              {(chapter.updated_at || chapter.created_at) && (
                                <p className="text-xs text-gray-500">
                                  {new Date(chapter.updated_at || chapter.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1">
                            Saat ini
                          </span>
                        </div>
                      </div>
                    ) : (
                      // For other chapters, use Link but prevent default behavior
                      <Link
                        key={chapter.id || index}
                        href={`/chapter/${bookSlug}/${chapter.number}/${chapterSlugUrl}`}
                        className={cn(
                          "block p-3 rounded-lg transition-all duration-200 border",
                          "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                        )}
                        onClick={(e) => {
                          // First close the drawer
                          local.showChapterList = false;
                          local.render();
                          // Navigation will happen automatically
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Chapter {chapter.number}: {chapter.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-500">
                                {formatWordCount(chapter.word_count || 0)}
                              </p>
                              {(chapter.updated_at || chapter.created_at) && (
                                <p className="text-xs text-gray-500">
                                  {new Date(chapter.updated_at || chapter.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-500">Tidak ada chapter tersedia</div>
                </div>
              )}
            </div>
          </div>
      
      {/* Reviews Drawer */}
      {/* Backdrop with 50% opacity */}
      <div 
        className={cn(
          "fixed inset-0 bg-black z-[60] transition-opacity duration-300 ease-in-out",
          local.showReviewsDrawer ? "opacity-50 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => {
          local.showReviewsDrawer = false;
          local.render();
        }}
      />
      
      {/* Drawer from left */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-96 bg-white shadow-xl z-[70] transform transition-transform duration-300 ease-in-out overflow-hidden",
        local.showReviewsDrawer ? "translate-x-0" : "-translate-x-full"
      )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Review Chapter {chapterNumber}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  local.showReviewsDrawer = false;
                  local.render();
                }}
              >
                ✕
              </Button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {local.loadingReviews ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-500">Memuat review...</div>
                </div>
              ) : local.reviews.length > 0 ? (
                <div className="p-4 space-y-4">
                  {local.reviews.map((review: any) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          {review.user.avatar ? (
                            <img 
                              src={review.user.avatar} 
                              alt={review.user.name} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-700">
                              {review.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                            {review.rating && (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span 
                                    key={star} 
                                    className={star <= review.rating ? "text-yellow-500" : "text-gray-300"}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                          {review.chapter && (
                            <p className="text-xs text-gray-500 mb-2">
                              Chapter {review.chapter.number}: {review.chapter.name}
                            </p>
                          )}
                          <div className="flex items-center gap-4">
                            <button 
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                review.userLiked 
                                  ? "text-blue-600 hover:text-blue-700" 
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <ThumbsUp className={`w-3 h-3 ${review.userLiked ? "fill-current" : ""}`} />
                              <span>{review.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center mb-4">Belum ada review untuk chapter ini</p>
                  <Button
                    onClick={() => {
                      local.showReviewsDrawer = false;
                      local.showReviewModal = true;
                      local.render();
                    }}
                    className="bg-(--esensi-color) hover:bg-(--esensi-color) hover:opacity-90 text-white"
                  >
                    Tulis Review Pertama
                  </Button>
                </div>
              )}
            </div>
            
            {/* Footer with Add Review Button */}
            {local.reviews.length > 0 && local.isLoggedIn && (
              <div className="p-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    local.showReviewsDrawer = false;
                    local.showReviewModal = true;
                    local.render();
                  }}
                  className="w-full bg-(--esensi-color) hover:bg-(--esensi-color) hover:opacity-90 text-white"
                >
                  Tambah Review
                </Button>
              </div>
            )}
          </div>
      
      {/* Review Modal */}
      {local.showReviewModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black opacity-50 z-[60] transition-opacity duration-300 ease-in-out"
            onClick={() => {
              local.showReviewModal = false;
              local.render();
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className={cn(
              "bg-white rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out",
              local.showReviewModal ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Tambah Review</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    local.showReviewModal = false;
                    local.render();
                  }}
                >
                  ✕
                </Button>
              </div>
              <textarea
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Tulis review Anda..."
                value={local.reviewText}
                onChange={(e) => {
                  local.reviewText = e.target.value;
                  local.render();
                }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    local.showReviewModal = false;
                    local.render();
                  }}
                >
                  Batal
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  disabled={!local.reviewText.trim() || local.submittingReview}
                  onClick={handleSubmitReview}
                >
                  {local.submittingReview ? 'Mengirim...' : 'Kirim Review'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Gift Modal */}
      <GiftModal />
      <RechargeCoinsModal />
      
      {/* Unlock Chapter Modal */}
      <UnlockChapterModal
        isOpen={local.unlockModalOpen}
        onClose={() => {
          local.unlockModalOpen = false;
          local.selectedChapter = null;
          local.render();
        }}
        onConfirm={() => {
          // Handle unlock logic here
          console.log('Unlocking chapter:', local.selectedChapter);
          local.unlockModalOpen = false;
          local.render();
        }}
        chapterTitle={local.selectedChapter?.name || ''}
        chapterNumber={local.selectedChapter?.number || 0}
        coinPrice={local.selectedChapter?.coin_price || 0}
      />
    </>
  );
}