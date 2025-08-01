import { SeoTemplate } from "../../../components/SeoTemplate";
import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";

export default defineAPI({
  name: "index",
  url: "/index-draft",
  async handler() {
    const req = this.req!;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for better performance
    const [books_lastest, books_with_recent_chapters, genre, tags] = await Promise.all([
      // Query 1: Latest published books with published chapters
      db.book.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          cover: true,
          currency: true,
          submitted_price: true,
          published_date: true,
          story_views: true,
          author: {
            select: {
              name: true,
            },
          },
          book_genre: {
            select: {
              genre: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
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
          deleted_at: null,
          is_chapter: true,
          status: BookStatus.PUBLISHED,
          chapter: {
            some: {
              is_published: true,
              deleted_at: null,
            },
          },
        },
        orderBy: {
          published_date: "desc",
        },
        take: 10,
      }),

      // Query 2: Books with recently updated chapters (optimized single query)
      db.book.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          cover: true,
          currency: true,
          submitted_price: true,
          published_date: true,
          story_views: true,
          author: {
            select: {
              name: true,
            },
          },
          book_genre: {
            select: {
              genre: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
          chapter: {
            where: {
              updated_at: {
                gte: oneWeekAgo,
              },
              is_published: true,
              deleted_at: null,
            },
            orderBy: {
              updated_at: "desc",
            },
            take: 3,
          },
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
          deleted_at: null,
          is_chapter: true,
          status: BookStatus.PUBLISHED,
          OR: [
            // Books with published chapters updated in the last week
            {
              chapter: {
                some: {
                  updated_at: {
                    gte: oneWeekAgo,
                  },
                  is_published: true,
                  deleted_at: null,
                },
              },
            },
            // Fallback: any books with published chapters (if we need more)
            {
              chapter: {
                some: {
                  is_published: true,
                  deleted_at: null,
                },
              },
            },
          ],
        },
        orderBy: {
          published_date: "desc",
        },
        take: 12,
        distinct: ["id"],
      }),

      // Query 3: Genres
      db.genre.findMany({
        select: {
          name: true,
          slug: true,
        },
        where: {
          deleted_at: null,
        },
        take: 15,
      }),

      // Query 4: Tags
      db.tags.findMany({
        select: {
          name: true,
          slug: true,
          img: true,
        },
        where: {
          deleted_at: null,
          id_parent: null,
        },
      }),
    ]);

    const data = {
      title: `Esensi Chapter`,
      books_lastest: books_lastest,
      books_updated: books_with_recent_chapters,
      genre: genre,
      tags: tags,
    };

    const seo_data = {
      slug: `/`,
      meta_title: `Baca Chapter Web Novel Terbaru dan Terpopuler | Esensi Online - Katalog Cerita Indonesia`,
      meta_description: `Esensi Online menyajikan ribuan web novel terbaru dan terpopuler dari berbagai genre seperti fantasi, romantis, aksi, dan lainnya. Baca cerita online gratis dan update setiap hari!`,
      image: ``,
      headings: `Chapter Web Novel Terlengkap dan Terupdate di Esensi Online`,
      h2: `Genre Favorit Pembaca di Esensi Online`,
      h3: `Rilisan Web Novel Terbaru Hari Ini`,
      h4: `Cerita Paling Populer di Esensi Online Minggu Ini`,
      h5: `Bergabung di Esensi Online dan Mulai Membaca Sekarang`,
      paragraph: `Selamat datang di Esensi Online, rumah bagi ratusan web novel menarik dari penulis lokal dan internasional. Temukan cerita favoritmu dari genre seperti fantasi, romantis, aksi, horor, hingga slice of life. Esensi Online memperbarui koleksi ceritanya setiap hari dan bisa diakses secara gratis. Nikmati pengalaman membaca yang seru dan imajinatif bersama kami!`,
      keywords: ``,
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
