import { SeoTemplate } from "../../components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "rankings",
  url: "/rankings/:filter/:value/:daterange",
  async handler() {
    const req = this.req!;

    const filterby = req.params?.filter ? req.params.filter : null;
    const filterval = req.params?.value ? req.params.value : null;
    const daterange = req.params?.daterange ? req.params.daterange : null;

    const books = await db.book.findMany({
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
      where: {
        deleted_at: null,
      },
    });
    const data = {
      title: ``,
      content: ``,
    };

    const seo_data = {
      slug: `/rankings`,
      meta_title: `Peringkat Chapter Web Novel Terpopuler | Top Chart Cerita di Esensi Online`,
      meta_description: `Lihat daftar chapter web novel terpopuler di Esensi Online! Temukan cerita dengan pembaca terbanyak, rating tertinggi, dan update paling aktif. Mana favoritmu minggu ini?`,
      image: ``,
      headings: `Peringkat Web Novel Terpopuler | Top Chart Cerita di Esensi Online`,
      h2: `Ranking Web Novel Terpopuler di Esensi Online`,
      h3: `Top 10 Cerita Terbanyak Dibaca`,
      h4: `Web Novel dengan Rating Tertinggi`,
      h5: `Rising Stars: Cerita Baru yang Langsung Populer`,
      h6: `Update Ranking Terbaru dari Chapter Web Novel`,
      paragraph: `Ingin tahu cerita apa yang paling banyak dibaca dan dibicarakan minggu ini? Halaman peringkat di Esensi Online menampilkan daftar web novel terpopuler berdasarkan pembaca, rating, dan update terbaru. Dari kisah romantis yang bikin baper hingga aksi seru yang mendebarkan, semua ada di sini. Temukan bacaan yang sedang naik daun atau pertahankan favoritmu di puncak ranking!`,
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
