import { SeoTemplate } from "../../components/SeoTemplate";
import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";

export default defineAPI({
  name: "tags",
  url: "/tags/:slug/:page",
  async handler() {
    const req = this.req!;
    const page = req.params?.page ? parseInt(req.params.page) : 1;
    const books_per_page = 20;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;

    const tag_slug = req?.params.slug ? req.params.slug : ``;

    const tag = await db.tags.findFirst({
      where: {
        slug: tag_slug,
        deleted_at: null,
      },
      include: {
        book_tags: true,
      },
    });

    const books = await db.book.findMany({
      where: {
        id: {
          in: tag?.book_tags?.map((x) => x.id_book),
        },
        is_chapter: true,
        status: BookStatus.PUBLISHED,
        deleted_at: null,
      },
      select: {
        id: true,
        cover: true,
        desc: true,
        currency: true,
        name: true,
        submitted_price: true,
        slug: true,
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
      skip: skip_books,
      take: books_per_page,
      orderBy: {
        published_date: "desc",
      },
    });

    const total_pages = Math.ceil(
      (await db.book.count({
        where: {
          id: {
            in: tag?.book_tags?.map((x) => x.id_book),
          },
          status: BookStatus.PUBLISHED,
          deleted_at: null,
        },
      })) / books_per_page
    );

    const data = {
      title: `Ebook tentang ${tag?.name}`,
      products: books,
      page: page,
      pages: total_pages,
    };

    const seo_data = {
      slug: `/tags/${req.params?.slug ? `${req.params.slug}` : ``}${
        page > 1 ? `/${page}` : ``
      }`,
      page: page,
      meta_title: `Web Novel Tag ${tag?.name} | Koleksi Cerita ${tag?.name} di Esensi Online`,
      meta_description: `Temukan cerita-cerita dengan tag ${tag?.name} di Esensi Online. Baca web novel bertema ${tag?.name} yang seru, update, dan bisa diakses kapan saja!`,
      image: ``,
      headings: `Web Novel dengan Tag ${tag?.name} di Esensi Online`,
      h2: `Koleksi Cerita ${tag?.name} Terpopuler`,
      h3: `Update Terbaru untuk Tag ${tag?.name}`,
      h4: `Jelajahi ${tag?.name} Lainnya di Esensi Online`,
      paragraph: `Tag ${tag?.name} di Esensi Online mengumpulkan cerita-cerita bertema ${tag?.name}. Temukan berbagai judul seru dan unik yang bisa kamu baca kapan saja. Koleksi ini selalu diperbarui untuk menghadirkan bacaan terbaik bagi para pecinta genre ini.`,
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
