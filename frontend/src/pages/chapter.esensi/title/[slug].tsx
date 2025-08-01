import { api } from "@/lib/gen/chapter.esensi";
import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, BookOpen, Flag, Clock, Users, ThumbsUp, NotebookText, Plus, Gift, Lock, Coins, ChevronDown } from "lucide-react";
import React from "react";
import { CoverImage } from "@/components/esensi/ui/cover-image";
import { GiftModal } from "@/components/esensi/chapter/gift-modal";
import { RechargeCoinsModal } from "@/components/esensi/chapter/recharge-coins-modal";
import { giftModalState } from "@/lib/states/gift-modal-state";
import { UnlockChapterModal } from "@/components/esensi/chapter/unlock-chapter-modal";
import { useLocal } from "@/lib/hooks/use-local";

export default (data: Awaited<ReturnType<typeof api.title>>["data"]) => {
  const local = {
    book: data?.book,
    chapters: data?.chapters || [],
    author: data?.author,
    genres: data?.genres || [],
    tags: data?.tags || [],
    userProgress: data?.userProgress,
    userHasLiked: data?.userHasLiked || false,
  };

  console.log('Title page data:', data);
  
  const [activeTab, setActiveTab] = React.useState<'about' | 'chapters'>('about');
  
  // State for unlock modal
  const unlockModal = useLocal({
    isOpen: false,
    selectedChapter: null as any,
  });

  // State for chapter sorting
  const chapterSort = useLocal({
    sortBy: 'number_asc' as 'number_asc' | 'number_desc' | 'price_low' | 'price_high' | 'updated' | 'words_most' | 'words_least',
    isDropdownOpen: false,
  });

  // Function to format relative date
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

  // Function to format word count
  const formatWordCount = (count: number) => {
    if (!count) return '0 kata';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k kata`;
    }
    return `${count} kata`;
  };

  // Function to format numbers (same as BookCard)
  const numberFormatter = (the_number: number) => {
    if (the_number >= 1000000000) {
      return (the_number / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
    } else if (the_number >= 1000000) {
      return (the_number / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    } else if (the_number >= 1000) {
      return (the_number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return the_number.toString();
  };

  // Function to sort chapters
  const getSortedChapters = () => {
    const chapters = [...local.chapters];
    
    switch (chapterSort.sortBy) {
      case 'number_asc':
        return chapters.sort((a, b) => a.number - b.number);
      case 'number_desc':
        return chapters.sort((a, b) => b.number - a.number);
      case 'price_low':
        return chapters.sort((a, b) => (a.coin_price || 0) - (b.coin_price || 0));
      case 'price_high':
        return chapters.sort((a, b) => (b.coin_price || 0) - (a.coin_price || 0));
      case 'updated':
        return chapters.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA;
        });
      case 'words_most':
        return chapters.sort((a, b) => (b.word_count || 0) - (a.word_count || 0));
      case 'words_least':
        return chapters.sort((a, b) => (a.word_count || 0) - (b.word_count || 0));
      default:
        return chapters;
    }
  };

  const sortOptions = [
    { value: 'number_asc', label: 'Nomor Chapter' },
    { value: 'number_desc', label: 'Nomor Chapter (Terbalik)' },
    { value: 'price_low', label: 'Harga Terendah' },
    { value: 'price_high', label: 'Harga Tertinggi' },
    { value: 'updated', label: 'Terakhir Diperbarui' },
    { value: 'words_most', label: 'Kata Terbanyak' },
    { value: 'words_least', label: 'Kata Tersedikit' },
  ];

  if (!local.book) {
    return (
      <EsensiChapterLayout>
        <div className="esensi-container">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <h2 className="text-2xl font-semibold text-(--esensi-color)">Buku tidak ditemukan</h2>
            <Link href="/chapter.esensi" className="esensi-button">
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </EsensiChapterLayout>
    );
  }


  return (
    <EsensiChapterLayout>
      <div className="esensi-container">
        <div className="flex flex-col gap-6 py-6">
          {/* Book Cover and Info - Side by Side */}
          <div className="bg-white rounded-lg lg:p-6">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Book Cover */}
              <div className="md:w-1/4 flex-shrink-0">
                <div className="aspect-[3/4] rounded-lg overflow-hidden">
                  <CoverImage
                    src={local.book.cover}
                    title={local.book.name}
                    author={local.author?.name || "Unknown Author"}
                    className="w-full h-full"
                    alt={local.book.name}
                  />
                </div>
              </div>
              
              {/* Book Info */}
              <div className="md:w-3/4 flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {local.book.name}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    local.book.is_completed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {local.book.is_completed ? 'Completed' : 'Ongoing'}
                  </span>
                </div>

                {/* Author */}
                <p className="text-gray-600 mb-4">
                  Author: {local.author ? (
                    <Link href={`/author/${local.author.slug}`} className="text-gray-900 hover:text-primary transition-colors">
                      {local.author.name}
                    </Link>
                  ) : (
                    <span className="text-gray-900">Unknown Author</span>
                  )}
                </p>

                {/* Book Stats */}
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1" title={`${local.book.story_views || 0} views`}>
                    <Eye className="w-4 h-4" />
                    <span>{numberFormatter(local.book.story_views || 0)} Views</span>
                  </div>
                  <div className="flex items-center gap-1" title={`${local.book._count?.book_likes || 0} likes`}>
                    <ThumbsUp className="w-4 h-4" />
                    <span>{numberFormatter(local.book._count?.book_likes || 0)} Likes</span>
                  </div>
                  <div className="flex items-center gap-1" title={`${local.book._count?.chapter || 0} chapters`}>
                    <NotebookText className="w-4 h-4" />
                    <span>{numberFormatter(local.book._count?.chapter || 0)} Chapters</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 mb-4 text-gray-700">
                  {local.genres.length > 0 && local.genres[0].genre && (
                    <Link href={`/genre/${local.genres[0].genre.slug}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm">{local.genres[0].genre.name}</span>
                    </Link>
                  )}
                </div>



                <div className="flex justify-center md:justify-start mb-6">
                  {/* Split Button */}
                  <div className="flex w-full md:w-auto bg-(--esensi-color) text-white rounded-full overflow-hidden">
                    {/* READ Section */}
                    {local.chapters.length > 0 ? (
                      <Link
                        href={`/chapter/${local.book.slug}/${local.chapters[0].number}/${local.chapters[0].slug}`}
                        className="flex-1 md:flex-none px-8 py-2 hover:bg-opacity-90 transition-all font-medium flex items-center justify-center"
                      >
                        {local.userProgress ? 'Continue reading' : 'Start reading'}
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="flex-1 md:flex-none px-8 py-2 bg-gray-400 cursor-not-allowed font-medium flex items-center justify-center"
                      >
                        Start reading
                      </button>
                    )}
                    
                    {/* Divider */}
                    <div className="w-px bg-white bg-opacity-30"></div>
                    
                    {/* LIKE Section */}
                    <button className={`px-6 py-2 hover:bg-opacity-90 transition-all font-medium flex items-center gap-2 justify-center ${
                      local.userHasLiked ? 'bg-opacity-80' : ''
                    }`}>
                      <ThumbsUp className={`w-4 h-4 ${local.userHasLiked ? 'fill-current' : ''}`} />
                      <span>{local.userHasLiked ? 'Liked' : 'Like'}</span>
                    </button>
                    
                    {/* Divider */}
                    <div className="w-px bg-white bg-opacity-30"></div>
                    
                    {/* ADD TO LIBRARY Section */}
                    <button className="px-4 py-2 hover:bg-opacity-90 transition-all font-medium flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1"></div>

                {/* Tags */}
                {local.tags && local.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {local.tags.map((bookTag, idx) => (
                        <Link
                          key={`tag-${idx}`}
                          href={`/tag/${bookTag.tags?.slug}`}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 text-sm rounded-full transition-colors"
                        >
                          #{bookTag.tags?.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                  <Flag className="w-4 h-4" />
                  Report story
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-white rounded-lg ">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`px-6 py-4 font-semibold text-lg transition-colors cursor-pointer ${
                    activeTab === 'about'
                      ? 'text-(--esensi-color) border-b-3 border-(--esensi-color)'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveTab('chapters')}
                  className={`px-6 py-4 font-semibold text-lg transition-colors cursor-pointer ${
                    activeTab === 'chapters'
                      ? 'text-(--esensi-color) border-b-3 border-(--esensi-color)'
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Chapters ({local.chapters.length})
                    </h3>
                    
                    {/* Sort Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          chapterSort.isDropdownOpen = !chapterSort.isDropdownOpen;
                          chapterSort.render();
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span>{sortOptions.find(opt => opt.value === chapterSort.sortBy)?.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${chapterSort.isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {chapterSort.isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                chapterSort.sortBy = option.value as any;
                                chapterSort.isDropdownOpen = false;
                                chapterSort.render();
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                chapterSort.sortBy === option.value ? 'bg-gray-50 font-medium' : ''
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {local.chapters.length > 0 ? (
                    <div className="space-y-2">
                      {getSortedChapters().map((chapter, idx) => {
                        const isLocked = chapter.number > 10 && chapter.coin_price > 0;
                        
                        return isLocked ? (
                          <div
                            key={chapter.id}
                            className="relative block p-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                          >
                            {/* Lock overlay */}
                            <div className="absolute inset-0 bg-gray-100 opacity-50 z-10"></div>
                            
                            <div className="relative z-20 flex flex-col md:flex-row md:justify-between md:items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-medium text-gray-900">
                                    Chapter {chapter.number}: {chapter.name}
                                  </h4>
                                  <Lock className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                  <span>{formatWordCount(chapter.word_count || 0)}</span>
                                  <span className="md:hidden">•</span>
                                  {(chapter.updated_at || chapter.created_at) && (() => {
                                    const dateInfo = formatRelativeDate(
                                      chapter.updated_at || chapter.created_at,
                                      chapter.updated_at ? 'updated' : 'published'
                                    );
                                    return (
                                      <span title={dateInfo.title} className="text-xs md:hidden">
                                        {dateInfo.text}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                              
                              {/* Unlock button */}
                              <div className="mt-3 md:mt-0">
                                <button 
                                  className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    unlockModal.isOpen = true;
                                    unlockModal.selectedChapter = chapter;
                                    unlockModal.render();
                                  }}
                                >
                                  <Coins className="w-4 h-4" />
                                  <span>{chapter.coin_price || 0} Buka</span>
                                </button>
                              </div>
                              
                              {/* Desktop date display */}
                              <div className="hidden md:flex flex-col items-end gap-1 text-sm text-gray-500 ml-4">
                                {(chapter.updated_at || chapter.created_at) && (() => {
                                  const dateInfo = formatRelativeDate(
                                    chapter.updated_at || chapter.created_at,
                                    chapter.updated_at ? 'updated' : 'published'
                                  );
                                  return (
                                    <span title={dateInfo.title} className="text-xs">
                                      {dateInfo.text}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            key={chapter.id}
                            href={`/chapter/${local.book.slug}/${chapter.number}/${chapter.slug}`}
                            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  Chapter {chapter.number}: {chapter.name}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                  <span>{formatWordCount(chapter.word_count || 0)}</span>
                                  <span className="md:hidden">•</span>
                                  {(chapter.updated_at || chapter.created_at) && (() => {
                                    const dateInfo = formatRelativeDate(
                                      chapter.updated_at || chapter.created_at,
                                      chapter.updated_at ? 'updated' : 'published'
                                    );
                                    return (
                                      <span title={dateInfo.title} className="text-xs md:hidden">
                                        {dateInfo.text}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                              {/* Desktop date display */}
                              <div className="hidden md:flex flex-col items-end gap-1 text-sm text-gray-500 ml-4">
                                {(chapter.updated_at || chapter.created_at) && (() => {
                                  const dateInfo = formatRelativeDate(
                                    chapter.updated_at || chapter.created_at,
                                    chapter.updated_at ? 'updated' : 'published'
                                  );
                                  return (
                                    <span title={dateInfo.title} className="text-xs">
                                      {dateInfo.text}
                                    </span>
                                  );
                                })()}
                                {chapter.views && (
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{chapter.views}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
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

          {/* Gifts Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gifts</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                  <Gift className="w-6 h-6 text-orange-600" />
                </div>
                
                <button 
                  onClick={() => (giftModalState.write.isOpen = true)}
                  className="px-6 py-2 bg-[var(--esensi-color)] text-white rounded-full hover:bg-[var(--esensi-color)] hover:opacity-90 transition-all font-medium"
                >
                  KIRIM HADIAH
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
      <GiftModal />
      <RechargeCoinsModal />
      
      {/* Unlock Chapter Modal */}
      <UnlockChapterModal
        isOpen={unlockModal.isOpen}
        onClose={() => {
          unlockModal.isOpen = false;
          unlockModal.selectedChapter = null;
          unlockModal.render();
        }}
        onConfirm={() => {
          // Handle unlock logic here
          console.log('Unlocking chapter:', unlockModal.selectedChapter);
          unlockModal.isOpen = false;
          unlockModal.render();
        }}
        chapterTitle={unlockModal.selectedChapter?.name || ''}
        chapterNumber={unlockModal.selectedChapter?.number || 0}
        coinPrice={unlockModal.selectedChapter?.coin_price || 0}
      />
    </EsensiChapterLayout>
  );
};