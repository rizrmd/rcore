import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi"; // If api.chapter is undefined, run: bun run scripts/dev.ts gen
import { ChapterInteraction } from "./chapter-interaction";
import { Calendar, BookOpen, Loader2, Lock } from "lucide-react";
import { useEffect, useRef, useCallback } from "react";
import { formatReadableDate, formatThousands } from "@/lib/utils";
import { current } from "@/components/app/protected";

interface Chapter {
  id: string;
  number: string;
  name: string;
  slug: string;
  content: string | any;
  created_at?: string;
  word_count?: number;
  coin_price?: number;
  is_monetized?: boolean;
  hasAccess?: boolean;
}

interface Book {
  id: string;
  name: string;
  slug: string;
}

interface InfiniteChapterReaderProps {
  initialChapter: Chapter;
  book: Book;
  bookId: string; // Add book ID for database queries
  nextChapter?: Chapter;
  allChapters?: Chapter[];
}

export function InfiniteChapterReader({ initialChapter, book, bookId, nextChapter }: InfiniteChapterReaderProps) {
  // Debug initial props
  console.log("InfiniteChapterReader initialized with:", {
    initialChapter: initialChapter?.number,
    book: book?.name,
    bookId: bookId,
    nextChapter: nextChapter
  });
  
  const local = useLocal({
    chapters: [initialChapter] as Chapter[],
    loading: false,
    hasMore: !!nextChapter,
    currentChapterIndex: 0
  });

  const loadingRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ loading: false, hasMore: !!nextChapter });

  const loadNextChapter = useCallback(async () => {
    if (stateRef.current.loading || !stateRef.current.hasMore) {
      console.log("Cannot load:", { 
        loading: stateRef.current.loading, 
        hasMore: stateRef.current.hasMore
      });
      return;
    }

    // Get the current last chapter to find the next one
    const currentLastChapter = local.chapters[local.chapters.length - 1];
    const currentChapterNumber = parseInt(currentLastChapter.number);
    
    console.log("Finding next chapter after:", currentChapterNumber);
    stateRef.current.loading = true;
    local.loading = true;
    local.render();

    try {
      // First, check if there's a next chapter in the database
      const nextChapterRes = await api.next_chapter({
        id_book: bookId,
        current_chapter_number: currentChapterNumber,
        id_user: current.user?.id
      });

      if (!nextChapterRes?.success || !nextChapterRes.data) {
        console.log("No more chapters available");
        local.hasMore = false;
        stateRef.current.hasMore = false;
        return;
      }

      const { chapter: nextChapterInfo, book: bookInfo } = nextChapterRes.data;
      
      if (!nextChapterInfo.slug) {
        console.error("Next chapter missing slug:", nextChapterInfo);
        throw new Error("Chapter slug is required but missing from database");
      }
      
      console.log("Loading next chapter:", {
        bookSlug: bookInfo.slug,
        chapterNumber: nextChapterInfo.number,
        chapterSlug: nextChapterInfo.slug,
        hasAccess: nextChapterInfo.hasAccess
      });
      
      // Add the chapter to our list (locked or unlocked)
      local.chapters.push(nextChapterInfo);
      
      console.log("Successfully loaded chapter:", nextChapterInfo.number);
      
      // Check if there are more chapters after this one
      const hasMoreRes = await api.next_chapter({
        id_book: bookId,
        current_chapter_number: parseInt(String(nextChapterInfo.number)),
        id_user: current.user?.id
      });
      
      const hasMore = hasMoreRes?.success && hasMoreRes?.data !== null;
      local.hasMore = hasMore;
      stateRef.current.hasMore = hasMore;
      
      console.log("More chapters available:", hasMore);
    } catch (error) {
      console.error("Failed to load next chapter:", error);
      local.hasMore = false;
      stateRef.current.hasMore = false;
    } finally {
      local.loading = false;
      stateRef.current.loading = false;
      local.render();
    }
  }, [book.slug, bookId, local, stateRef]);

  const renderChapterContent = (content: string | any) => {
    if (typeof content === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    
    // Handle JSON content (EditorJS format)
    return content?.blocks?.map((block: any, index: number) => {
      if (block.type === 'paragraph') {
        return <p key={index} className="text-lg leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
      }
      if (block.type === 'header') {
        const level = block.data.level;
        const content = { __html: block.data.text };
        const className = "font-bold mb-4";
        if (level === 1) return <h1 key={index} className={`text-3xl ${className}`} dangerouslySetInnerHTML={content} />;
        if (level === 2) return <h2 key={index} className={`text-2xl ${className}`} dangerouslySetInnerHTML={content} />;
        if (level === 3) return <h3 key={index} className={`text-xl ${className}`} dangerouslySetInnerHTML={content} />;
        if (level === 4) return <h4 key={index} className={`text-lg ${className}`} dangerouslySetInnerHTML={content} />;
        if (level === 5) return <h5 key={index} className={`text-base ${className}`} dangerouslySetInnerHTML={content} />;
        if (level === 6) return <h6 key={index} className={`text-sm ${className}`} dangerouslySetInnerHTML={content} />;
      }
      if (block.type === 'list') {
        const items = block.data.items.map((item: string, i: number) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
        ));
        return block.data.style === 'ordered' 
          ? <ol key={index} className="list-decimal list-inside mb-4">{items}</ol>
          : <ul key={index} className="list-disc list-inside mb-4">{items}</ul>;
      }
      if (block.type === 'quote') {
        return (
          <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-4" 
                     dangerouslySetInnerHTML={{ __html: block.data.text }} />
        );
      }
      return null;
    });
  };

  // Sync state ref with local state
  useEffect(() => {
    stateRef.current = {
      loading: local.loading,
      hasMore: local.hasMore
    };
  }, [local.loading, local.hasMore]);

  useEffect(() => {
    console.log("Setting up intersection observer", { hasMore: local.hasMore, loading: local.loading });
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      console.log("Intersection observer triggered:", { 
        isIntersecting: entry.isIntersecting, 
        hasMore: stateRef.current.hasMore, 
        loading: stateRef.current.loading 
      });
      
      if (entry.isIntersecting && stateRef.current.hasMore && !stateRef.current.loading) {
        console.log("Triggering loadNextChapter");
        loadNextChapter();
      }
    };
    
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '200px',
      threshold: 0.1
    });

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
      console.log("Observer attached to loading ref");
    } else {
      console.log("Loading ref not available");
    }

    return () => {
      console.log("Cleaning up observer");
      observer.disconnect();
    };
  }, [loadNextChapter]);

  return (
    <div className="space-y-8">
      {local.chapters.map((chapter, index) => (
        <div key={`${chapter.id}-${index}`} className="space-y-8">
          {/* Chapter Content */}
          <div className="bg-white rounded-lg p-8">
            {/* Chapter Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Chapter {chapter.number}:<br />
                {chapter.name}
              </h1>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                {chapter.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatReadableDate(chapter.created_at)}
                    </span>
                  </div>
                )}
                {chapter.word_count && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{formatThousands(chapter.word_count)} kata</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chapter Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed space-y-6">
                {chapter.hasAccess === false ? (
                  // Show locked content section
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold text-gray-700">Chapter Terkunci</h3>
                      <p className="text-gray-500">
                        Chapter ini memerlukan {chapter.coin_price} koin untuk dibuka
                      </p>
                      <button className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium">
                        Buka Chapter ({chapter.coin_price} koin)
                      </button>
                    </div>
                  </div>
                ) : chapter.content ? (
                  renderChapterContent(chapter.content)
                ) : (
                  <p className="text-gray-500 italic">Konten chapter tidak tersedia.</p>
                )}
              </div>
            </div>
          </div>

          {/* Chapter Interaction */}
          <ChapterInteraction 
            chapterId={chapter.id} 
            bookSlug={book.slug}
          />

          {/* Chapter Separator */}
          {index < local.chapters.length - 1 && (
            <div className="border-t-2 border-dashed border-gray-200 py-8">
              <div className="text-center">
                <div className="inline-block bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600">
                  Chapter berikutnya dimuat otomatis
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Loading Trigger */}
      {local.hasMore && (
        <div ref={loadingRef} className="flex items-center justify-center py-8">
          <div className="text-center">
            {local.loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm text-gray-500">Memuat chapter berikutnya...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Scroll untuk memuat chapter berikutnya</div>
            )}
          </div>
        </div>
      )}

      {/* End of chapters */}
      {!local.hasMore && !local.loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Akhir Chapter</h3>
            <p>Anda telah membaca semua chapter yang tersedia.</p>
          </div>
        </div>
      )}
    </div>
  );
}