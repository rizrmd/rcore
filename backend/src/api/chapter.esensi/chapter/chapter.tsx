import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";
import { SeoTemplate } from "../../../components/SeoTemplate";


export default defineAPI({
  name: "chapter",
  url: "/chapter/:bookSlug/:chapterNumber/:chapterSlug",
  async handler(args?: { bookSlug?: string; chapterNumber?: string; chapterSlug?: string }) {
    const req = this.req!;
    // Get parameters from either function args or URL params
    const bookSlug = args?.bookSlug || req.params.bookSlug;
    const chapterNumber = args?.chapterNumber || req.params.chapterNumber;
    const chapterSlug = args?.chapterSlug || req.params.chapterSlug;

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


    let data = {
      title: `` as string,
      chapter: null as any,
      book: book as any,
      prevChapter: null as any,
      nextChapter: null as any,
      message: `` as string,
    };

    if (!book) {
      data.message = "Book not found";
      return {
        jsx: <></>,
        data:data,
      };
    }

    // Find the current chapter
    const chapter_number = parseInt(chapterNumber);
    const chapter = await db.chapter.findFirst({
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
        content: true,
        created_at: true,
        word_count: true,
      },
    });

    if (!chapter) {
      data.message = "Chapter not found";
      return {
        jsx: <></>,
        data: data,
      };
    }

    // Verify the chapter slug matches database slug
    if (chapter.slug !== chapterSlug) {
      data.message = "Chapter slug mismatch";
      return {
        jsx: <></>,
        data: data,
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


 
      data.title = `${chapter.name} - ${book.name}`;
      data.chapter = chapter;
      data.book = book;
      data.prevChapter = prevChapterWithSlug;
      data.nextChapter = nextChapterWithSlug;
      data.message = ``;


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