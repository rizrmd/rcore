import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";
import { SeoTemplate } from "../../components/SeoTemplate";


export default defineAPI({
  name: "chapter",
  url: "/chapter/:bookSlug/:chapterNumber/:chapterSlug",
  async handler() {
    const req = this.req!;
    const { bookSlug, chapterNumber, chapterSlug } = req.params;

    console.log("Chapter API called with params:", { bookSlug, chapterNumber, chapterSlug });

    // Find the book first
    const book = await db.book.findFirst({
      select: {
        id: true,
        name: true,
        slug: true,
        cover: true,
        status: true,
        is_chapter: true,
        story_views: true,
        _count: {
          select: {
            chapter: {
              where: {
                deleted_at: null,
                is_published: true,
              },
            },
            book_likes: true,
          },
        },
      },
      where: {
        slug: bookSlug,
        status: BookStatus.PUBLISHED,
        is_chapter: true,
        deleted_at: null,
      },
    });

    if (!book) {
      console.log("Book not found with slug:", bookSlug);
      return {
        jsx: <></>,
        data: { error: "Book not found" },
      };
    }

    console.log("Book found:", { id: book.id, name: book.name, slug: book.slug });

    // Find the current chapter by id_book, number, and slug
    const chapter_number = parseInt(chapterNumber);
    
    // First, let's check what chapters exist for this book with this number
    const existingChapters = await db.chapter.findMany({
      where: {
        id_book: book.id,
        number: chapter_number,
        deleted_at: null,
        is_published: true,
      },
      select: {
        id: true,
        number: true,
        name: true,
        slug: true,
      },
    });
    
    console.log("Existing chapters with number", chapter_number, ":", existingChapters);
    console.log("Looking for slug:", chapterSlug);
    
    // Try to find chapter with exact slug match first
    let chapter = await db.chapter.findFirst({
      where: {
        id_book: book.id,
        number: chapter_number,
        slug: chapterSlug,
        deleted_at: null,
        is_published: true,
      },
      select: {
        id: true,
        number: true,
        name: true,
        slug: true,
        content: true,
        created_at: true,
        word_count: true,
        coin_price: true,
        is_monetized: true,
      },
    });

    // If not found and there's only one chapter with this number, use it
    if (!chapter && existingChapters.length === 1) {
      console.log("Chapter not found by slug, but only one chapter exists with this number. Using it.");
      chapter = await db.chapter.findFirst({
        where: {
          id: existingChapters[0].id,
        },
        select: {
          id: true,
          number: true,
          name: true,
          slug: true,
          content: true,
          created_at: true,
          word_count: true,
          coin_price: true,
          is_monetized: true,
        },
      });
    }

    if (!chapter) {
      console.log("Chapter not found with params:", { 
        id_book: book.id, 
        number: chapter_number, 
        slug: chapterSlug,
        existingChaptersFound: existingChapters.length,
        existingSlugs: existingChapters.map(ch => ch.slug)
      });
      return {
        jsx: <></>,
        data: { 
          error: "Chapter not found",
          debug: {
            requestedSlug: chapterSlug,
            availableSlugs: existingChapters.map(ch => ch.slug),
            bookId: book.id,
            chapterNumber: chapter_number
          }
        },
      };
    }

    // Find previous chapter
    const prevChapter = await db.chapter.findFirst({
      where: {
        id_book: book.id,
        number: chapter.number - 1,
        deleted_at: null,
        is_published: true,
      },
      select: {
        id: true,
        number: true,
        name: true,
        slug: true,
      },
    });

    // Find next chapter
    const nextChapter = await db.chapter.findFirst({
      where: {
        id_book: book.id,
        number: chapter.number + 1,
        deleted_at: null,
        is_published: true,
      },
      select: {
        id: true,
        number: true,
        name: true,
        slug: true,
      },
    });

    // Use database slugs for prev/next chapters
    const prevChapterWithSlug = prevChapter;
    const nextChapterWithSlug = nextChapter;

    const data = {
      title: `${chapter.name} - ${book.name}`,
      chapter: chapter,
      book: book,
      prevChapter: prevChapterWithSlug,
      nextChapter: nextChapterWithSlug,
      content: ``,
    };

    const seo_data = {
      slug: `/chapter/${bookSlug}/${chapterNumber}/${chapterSlug}`,
      meta_title: `${chapter.name} - ${book.name} | Esensi Online`,
      meta_description: `Baca ${chapter.name} dari ${book.name} di Esensi Online. Chapter ${chapter.number} dengan konten menarik dan berkualitas.`,
      image: `${book.cover}`,
      headings: `${chapter.name}`,
      paragraph: `Chapter ${chapter.number} dari ${book.name}`,
      keywords: `${book.name}, chapter ${chapter.number}`,
      is_product: false,
    };

    return {
      jsx: (
        <>
          <SeoTemplate data={seo_data} />
        </>
      ),
      data: data,
    };
  },
});
