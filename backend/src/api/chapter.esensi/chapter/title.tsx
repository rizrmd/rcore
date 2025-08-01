import { SeoTemplate } from "../../../components/SeoTemplate";
import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";

// Function to generate slug from chapter name
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove multiple consecutive hyphens
}

export default defineAPI({
  name: "title",
  url: "/title/:slug",
  async handler() {
    const req = this.req!;

    // if slug == "_" redirect to /browse

    const book = await db.book.findFirst({
      where: {
        slug: req.params.slug,
        status: BookStatus.PUBLISHED,
        is_chapter: true,
        deleted_at: null,
      },
      include: {
        _count: {
          select: {
            chapter: {
              where: {
                deleted_at: null,
                is_published: true,
              }
            },
            book_likes: true,
          }
        }
      }
    });

    const genres = await db.book_genre.findMany({
      where: {
        id_book: book?.id,
      },
      include: {
        genre: true,
      },
    });

    const genres_name = genres.map((g) => {
      return `, ${g.genre.name}`;
    });

    const tags = await db.book_tags.findMany({
      where: {
        id_book: book?.id,
      },
      include: {
        tags: true,
      },
    });

    const author = await db.auth_user.findFirst({
      select: {
        name: true,
        username: true,
        display_username: true,
        image: true,
      },
      where: {
        id_author: book?.id_author,
      },
    });

    const chaptersRaw = await db.chapter.findMany({
      where: {
        id_book: book?.id,
        deleted_at: null,
        is_published: true,
      },
      orderBy: {
        number: `asc`,
      },
      select: {
        id: true,
        number: true,
        name: true,
        created_at: true,
        word_count: true,
      },
    });

    // Add generated slugs to chapters
    const chapters = chaptersRaw.map(chapter => ({
      ...chapter,
      slug: generateSlug(chapter.name)
    }));

    const ratings = await db.book_reviews.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
      where: {
        id_book: book?.id,
        deleted_at: null,
        parent: null,
      },
    });

    const reviews = await db.book_reviews.findMany({
      where: {
        id_book: book?.id,
        deleted_at: null,
      },
    });

    const data = {
      title: `Detail Ebook`,
      book: book,
      chapters: chapters,
      author: author,
      tags: tags,
      ratings: ratings,
      reviews: reviews,
      content: ``,
    };

    const seo_data = {
      slug: `/title/${req.params.slug}`,
      meta_title: `${book?.name} - Chapter Web Novel oleh ${book?.info} | Esensi Online`,
      meta_description: `Baca ${book?.name} karya ${book?.info} di Esensi Online. Cerita ${genres_name} dengan alur yang menarik dan karakter yang kuat. Update secara berkala & gratis dibaca!`,
      image: `${book?.cover}`,
      headings: `${book?.name} oleh ${book?.info}`,
      paragraph: `${book?.desc}`,
      keywords: `${genres_name}`,
      is_product: true,
      price: book?.submitted_price,
      currencry: book?.currency,
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