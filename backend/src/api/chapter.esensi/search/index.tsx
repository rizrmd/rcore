import { defineAPI } from "rlib/server";
import { SeoTemplate } from "../../../components/SeoTemplate";

export default defineAPI({
  name: "search_index",
  url: "/search",
  async handler() {
    const data = {
      title: "Pencarian Buku",
    };

    const seo_data = {
      slug: "/search",
      page: 1,
      meta_title: "Pencarian Buku | Esensi Online",
      meta_description: "Cari dan temukan buku favorit Anda di Esensi Online. Pencarian berdasarkan judul, penulis, genre, atau tag untuk menemukan cerita yang sesuai dengan minat Anda.",
      image: "",
      headings: "Pencarian Buku di Esensi Online",
      h2: "Temukan Cerita Favorit Anda",
      h3: "Pencarian Berdasarkan Kata Kunci",
      h4: "Jelajahi Koleksi Lengkap",
      h5: "Mulai Petualangan Membaca",
      paragraph: "Selamat datang di halaman pencarian Esensi Online. Di sini Anda dapat mencari berbagai judul buku, penulis, genre, atau tag yang sesuai dengan minat membaca Anda. Masukkan kata kunci untuk memulai pencarian dan temukan cerita menarik yang telah menanti.",
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