import { api } from "@/lib/gen/chapter.esensi";
import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Star, Calendar, Eye, BookOpen, Flag, Clock, Users } from "lucide-react";
import React from "react";
import { CoverImage } from "@/components/esensi/ui/cover-image";
import { formatReadableDate } from "@/lib/utils";

export default (data: Awaited<ReturnType<typeof api.title>>["data"]) => {
  const local = {
    book: data?.book,
    chapters: data?.chapters || [],
    author: data?.author,
    tags: data?.tags || [],
    ratings: data?.ratings,
    reviews: data?.reviews || [],
  };

  console.log('Title page data:', data);
  
  const [activeTab, setActiveTab] = React.useState<'about' | 'chapters'>('about');

  if (!local.book) {
    return (
      <EsensiChapterLayout>
        <div className="esensi-container">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <h2 className="text-2xl font-semibold text-(--esensi-color)">Buku tidak ditemukan</h2>
            <Link href="/" className="esensi-button">
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </EsensiChapterLayout>
    );
  }

  const avgRating = local.ratings?._avg?.rating || 0;
  const totalReviews = local.ratings?._count?.id || 0;

  return (
    <EsensiChapterLayout>
      <div className="esensi-container">
        <div className="flex flex-col gap-6 py-6">
          {/* Book Cover and Info - Side by Side */}
          <div className="bg-white rounded-lg shadow-md lg:p-6">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Book Cover */}
              <div className="md:w-1/4 flex-shrink-0">
                <div className="aspect-[3/4] rounded-lg overflow-hidden">
                  <CoverImage
                    src={local.book.cover}
                    title={local.book.name}
                    author={local.author ? (local.author.display_username || local.author.username || local.author.name || "Unknown Author") : "Unknown Author"}
                    className="w-full h-full"
                    alt={local.book.name}
                  />
                </div>
              </div>
              
              {/* Book Info */}
              <div className="md:w-3/4">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {local.book.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 mb-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">Eastern</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">~ chs / week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    <span className="text-sm">{local.chapters.length} Chapters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">322.9K Views</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  Author: <span className="text-gray-900">{local.author ? (local.author.display_username || local.author.username || local.author.name) : "The Dream of the Green Caterpillar"}</span>
                </p>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.floor(avgRating) || avgRating === 0
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {totalReviews > 0 ? `${avgRating.toFixed(1)} (${totalReviews} reviews)` : "Not enough ratings"}
                  </span>
                </div>

                <div className="flex gap-3 mb-6">
                  {local.chapters.length > 0 ? (
                    <Link
                      href={`/chapter/${local.book.slug}/${local.chapters[0].number}/${local.chapters[0].slug}`}
                      className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
                    >
                      READ
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-2 bg-gray-400 text-white rounded-full cursor-not-allowed font-medium"
                    >
                      READ
                    </button>
                  )}
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                    <span className="text-lg">+</span>
                    ADD TO LIBRARY
                  </button>
                </div>

                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                  <Flag className="w-4 h-4" />
                  Report story
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-white rounded-lg shadow-md">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`px-6 py-4 font-semibold text-lg transition-colors ${
                    activeTab === 'about'
                      ? 'text-gray-900 border-b-3 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveTab('chapters')}
                  className={`px-6 py-4 font-semibold text-lg transition-colors ${
                    activeTab === 'chapters'
                      ? 'text-gray-900 border-b-3 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Table of Contents
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'about' ? (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Synopsis</h3>
                  <div className="text-gray-700 leading-relaxed">
                    {local.book.desc ? (
                      <p>{local.book.desc}</p>
                    ) : (
                      <div>
                        <p className="mb-3">"Mine, mine, it's all mine. I'll just take a bite, I, I, I'll just take a bite!!!"</p>
                        <p className="mb-3">Upon waking up, Hong Yuan had transmigrated to a chaotic world filled with monstrous demons, where life was as insignificant as grass.</p>
                        <p className="mb-3">His aptitude was extremely poor, advancing his cultivation at a snail's pace. Even possessing a proficiency panel did nothing to help. At this rate, his highest achievement in life would likely only be as the steward of an outer sect.</p>
                        <p>Luckily, he obtained an avatar of the Exotic Beast - Mysterious Water Snake.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Chapters ({local.chapters.length})
                  </h3>
                  {local.chapters.length > 0 ? (
                    <div className="space-y-2">
                      {local.chapters.map((chapter, idx) => (
                        <Link
                          key={chapter.id}
                          href={`/chapter/${local.book.slug}/${chapter.number}/${chapter.slug}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                Chapter {chapter.number}: {chapter.name}
                              </h4>
                              {chapter.created_at && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {formatReadableDate(chapter.created_at)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {chapter.views && (
                                <div className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  <span>{chapter.views}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No chapters available yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rating Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Rating</h3>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.floor(avgRating) || avgRating === 0
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
              
              <div className="flex-1">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-3">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-10 text-right">
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium">
                Write a Review
              </button>
            </div>
          </div>

          {/* User Reviews Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">User Reviews</h3>
            {local.reviews && local.reviews.length > 0 ? (
              <div className="space-y-4">
                {local.reviews.map((review: any, idx: number) => (
                  <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">Anonymous User</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (review.rating || 5)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.created_at ? formatReadableDate(review.created_at) : '1 day ago'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">
                      {review.comment || "Great story! Can't wait for the next chapter."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No reviews yet. Be the first to review!</p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium">
                  Write a Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </EsensiChapterLayout>
  );
};