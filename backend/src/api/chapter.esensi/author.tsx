import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";
import { SeoTemplate } from "../../components/SeoTemplate";

export default defineAPI({
  name: "author",
  url: "/author/:username/:page",
  async handler() {
    const req = this.req!;
    const page = req.params?.page ? parseInt(req.params.page) : 1;
    const books_per_page = 20;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;

    const user_data = await db.auth_user.findFirst({
      where: {
        username: req.params.username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        id_author: true,
      },
    });

    const author_data = await db.author.findFirst({
      where: {
        id: user_data?.id_author ?? undefined,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const author_books = await db.book.findMany({
      where: {
        id_author: user_data?.id_author ?? undefined,
        deleted_at: null,
        status: BookStatus.PUBLISHED,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        cover: true,
        currency: true,
        submitted_price: true,
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
      orderBy: {
        published_date: "desc",
      },
      take: books_per_page,
      skip: skip_books,
    });

    const total_pages = Math.ceil(
      (await db.book.count({
        where: {
          id_author: author_data?.id ?? undefined,
          status: BookStatus.PUBLISHED,
          deleted_at: null,
        },
      })) / books_per_page
    );

    const data = {
      title: ``,
      content: ``,
    };

    const seo_data = {
      slug: `/author/${req.params.username}${page > 1 ? `/${page}` : ``}`,
      page: page,
      meta_title: `Karya Web Novel oleh ${author_data?.name} | Esensi Online`,
      meta_description: `Jelajahi koleksi web novel karya ${author_data?.name} di Esensi Online. Baca cerita-cerita pilihan dengan gaya penulisan unik dan alur yang memikat.`,
      image: ``,
      headings: `Karya ${author_data?.name} di Esensi Online`,
      h2: `Web Novel Terpopuler oleh ${author_data?.name}`,
      h3: `Update Terbaru dari ${author_data?.name}`,
      h4: `Penulis Lain yang Mungkin Kamu Suka`,
      paragraph: `${author_data?.name} adalah penulis berbakat di Esensi Online yang dikenal dengan gaya menulis [ciri khas atau genre]. Di halaman ini, kamu bisa menemukan semua web novel karya mereka—mulai dari rilisan terbaru hingga cerita paling populer. Dukung penulis favoritmu dan nikmati karya-karyanya secara gratis!`,
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
