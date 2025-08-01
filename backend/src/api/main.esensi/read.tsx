import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "read",
  url: "/read/:slug",
  async handler() {
    const req = this.req!;

    const book_title = "";
    const uid = false; // cek user login
    const owned = false;

    // retreive produk jika user login dan punya produknya
    const product = uid && owned ? await db.product.findFirst({
      where: {
        slug: req.params.slug,
        deleted_at: null,
      },
      select:{
        name: true,
        cover: true,
        product_file: true,
      },
    }) : null;

    const data = {
      title: `Baca Ebook online`,
      product: product,
      owned: owned,
    };

    const seo_data = {
      slug: `/read/${req.params.slug}`,
      meta_title: `Baca ${book_title} online`,
      meta_description: `Buka eBook ${book_title} Anda dan nikmati pengalaman membaca tanpa batas!`,
      image: ``,
      headings: `Baca ${book_title} online`,
      paragraph: `Buka eBook ${book_title} Anda dan nikmati pengalaman membaca tanpa batas!`,
      is_product: false,
    };

    return {
      jsx: (<><SeoTemplate data={seo_data} /></>),
      data: data,
    };
  },
});
