import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "indexold",
  url: "/index-old",
  async handler() {

    const req = this.req!;

    const data = {
      title: `Esensi Online`,
      content: {},
    };

    const seo_data = {
      slug: `/`,
      meta_title: `Ebook Terlengkap Original, Murah, dan Terpercaya | Esensi Online`,
      meta_description: `Beli eBook berkualitas dengan harga terjangkau dan terpercaya. Koleksi lengkap, update rutin, dan proses pembelian mudah dan aman. Mulai jelajahi bacaan favoritmu sekarang!`,
      image: ``,
      headings: `Ebook Terlengkap Original, Murah, dan Terpercaya | Esensi Online`,
      paragraph: `Beli eBook berkualitas dengan harga terjangkau dan terpercaya. Koleksi lengkap, update rutin, dan proses pembelian mudah dan aman. Mulai jelajahi bacaan favoritmu sekarang!`,
      keywords: `toko buku,ebook`,
      is_product: false,
    };

    return {
      jsx: (<><SeoTemplate data={seo_data} /></>),
      data: data,
    };
  },
});
