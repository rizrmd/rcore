import { SeoTemplate } from "../../components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "library",
  url: "/library",
  async handler() {
    const req = this.req!;

    //const uid = this?.session?.user.id;
    const uid = ``;

    let data = {
      title: `Koleksi Ebook Milikmu`,
      content: {} as Record<
        string,
        {
          id: string;
          percent: number;
          last_page: number;
        }
      >,
    };

    if (uid) {
      
    }

    const seo_data = {
      slug: `/library`,
      meta_title: `Koleksi Buku Saya | Chapter Web Novel Favorit di Esensi Online`,
      meta_description: `Lihat daftar chapter web novel favoritmu di Esensi Online. Simpan, lanjutkan membaca, dan kelola koleksi bacaanmu dengan mudah dalam satu tempat.`,
      image: ``,
      headings: `Koleksi Buku Saya | Chapter Web Novel Favorit di Esensi Online`,
      h2: `Koleksi Buku Saya di Esensi Online`,
      h3: `Web Novel yang Sedang Dibaca`,
      h4: `Favorit atau Ditandai`,
      h5: `Update Terbaru dari Buku Saya`,
      h6: `Rekomendasi Berdasarkan Koleksimu`,
      paragraph: `Selamat datang di rak bukumu! Di halaman ini, kamu bisa melihat semua web novel yang kamu simpan atau favoritkan di Esensi Online. Lanjutkan membaca dari bab terakhir, pantau update terbaru, dan temukan rekomendasi cerita baru yang sesuai dengan minatmu. Koleksi ini akan selalu mengikuti perjalanan bacaanmu!`,
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
