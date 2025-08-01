import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "terbitan",
  url: "/terbitan",
  async handler() {
    
    const req = this.req!;

    const data = {
      title: `Informasi Terbitan Kami`,
      content: {},
    };

    const seo_data = {
      slug: `/terbitan`,
      meta_title: `Informasi Terbitan Kami | Kenali Penerbit dan Kualitas Ebook Digital Kami`,
      meta_description: `Temukan informasi lengkap tentang eBook terbitan kami. Kenali profil, visi, dan kontribusi kami dalam menghadirkan konten berkualitas.`,
      image: ``,
      headings: `Informasi Terbitan Kami | Kenali Penerbit dan Kualitas Ebook Digital Kami`,
      paragraph: `Temukan informasi lengkap tentang eBook terbitan kami. Kenali profil, visi, dan kontribusi kami dalam menghadirkan konten berkualitas.`,
      is_product: false,
    };

    return {
      jsx: (<><SeoTemplate data={seo_data} /></>),
      data: data,
    };
  },
});
