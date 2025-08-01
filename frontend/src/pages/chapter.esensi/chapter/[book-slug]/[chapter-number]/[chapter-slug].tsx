import { api } from "@/lib/gen/chapter.esensi";
import { ChapterLayout, InfiniteChapterReader } from "@/components/esensi/chapter";
import { Link } from "@/lib/router";
import { useRouter } from "@/lib/hooks/use-router";

export default (data: Awaited<ReturnType<typeof api.chapter>>["data"]) => {
  const router = useRouter();
  
  // Handle case where data might be an error response
  if (data && 'error' in data) {
    console.error("Chapter API error:", data.error);
    if ('debug' in data && data.debug) {
      console.error("Debug info:", data.debug);
    }
  }
  
  // Log the received data for debugging
  console.log("Chapter page received data:", data);
  
  const local = {
    chapter: data?.chapter,
    book: data?.book,
    nextChapter: data?.nextChapter,
    prevChapter: data?.prevChapter,
  };
  
  const bookSlug = router.params["book-slug"] as string;
  const chapterNumber = router.params["chapter-number"] as string;
  const chapterSlug = router.params["chapter-slug"] as string;

  if (!local.chapter || !local.book) {
    return (
      <ChapterLayout 
        bookSlug={bookSlug}
        chapterNumber={chapterNumber}
        chapterSlug={chapterSlug}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <h2 className="text-2xl font-semibold text-gray-700">Chapter tidak ditemukan</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Kembali ke beranda
          </Link>
        </div>
      </ChapterLayout>
    );
  }

  return (
    <ChapterLayout
      bookSlug={bookSlug}
      chapterNumber={chapterNumber}
      chapterSlug={chapterSlug}
      bookId={local.book.id}
      chapterId={local.chapter.id}
    >
      <InfiniteChapterReader
        initialChapter={local.chapter}
        book={local.book}
        bookId={local.book.id}
        nextChapter={local.nextChapter}
      />
    </ChapterLayout>
  );
};