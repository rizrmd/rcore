import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "resetpass",
  url: "/resetpass",
  async handler() {

    const req = this.req!;

    const data = {
      title: `Lupa Kata Sandi`,
      content: {},
    };

    const seo_data = {
      slug: `/resetpass`,
      meta_title: `Dapatkan bantuan untuk mengatur ulang kata sandi Anda`,
      meta_description: `Jika Anda lupa kata sandi, kami dapat membantu Anda mengatur ulangnya. Silakan masukkan alamat email Anda dan ikuti langkah-langkah yang diberikan.`,
      image: ``,
      headings: `Dapatkan bantuan untuk mengatur ulang kata sandi Anda`,
      paragraph: `Jika Anda lupa kata sandi, kami dapat membantu Anda mengatur ulangnya. Silakan masukkan alamat email Anda dan ikuti langkah-langkah yang diberikan.`,
      is_product: false,
    };

    return {
      jsx: (<><SeoTemplate data={seo_data} /></>),
      data: data,
    };
  },
});
