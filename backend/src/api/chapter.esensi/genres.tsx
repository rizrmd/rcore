import { defineAPI } from "rlib/server";
import { SeoTemplate } from "../../components/SeoTemplate";

export default defineAPI({
  name: "genres",
  url: "/genres",
  async handler() {
    const genres = await db.genre.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            book_genre: {
              where: {
                book: {
                  status: "PUBLISHED",
                  is_chapter: true,
                  deleted_at: null,
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const data = {
      title: "Daftar Genre Web Novel",
      genres: genres.map(genre => ({
        ...genre,
        book_count: genre._count.book_genre,
      })),
    };

    const seo_data = {
      slug: "/genres",
      page: 1,
      meta_title: "Daftar Genre Web Novel | Koleksi Lengkap Genre di Esensi Online",
      meta_description: "Jelajahi berbagai genre web novel di Esensi Online. Temukan cerita favorit dari romance, fantasy, action, dan genre lainnya!",
      image: "",
      headings: "Daftar Genre Web Novel di Esensi Online",
      h2: "Pilihan Genre Terlengkap",
      h3: "Temukan Cerita Sesuai Selera",
      h4: "Jelajahi Genre Favorit",
      paragraph: "Esensi Online menyediakan berbagai genre web novel untuk semua pembaca. Dari romance yang menyentuh hati hingga fantasy penuh petualangan, temukan cerita yang sesuai dengan selera bacaan Anda.",
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