import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "login",
  url: "/login",
  async handler() {
    const req = this.req!;

    //const uid = this?.session?.user.id;
    const uid = ``;
    let user = null;

    if (uid) {
      user = uid;
    }

    const data = {
      title: `Login ke Esensi`,
      userid: user,
    };

    const seo_data = {
      slug: `/login`,
      meta_title: `Masuk ke Akun Anda | Esensi Online`,
      meta_description: `Masuk ke akun Anda untuk mengakses ribuan ebook dan fitur lainnya di Esensi Online.`,
      image: ``,
      headings: `Masuk ke Akun Anda | Esensi Online`,
      paragraph: `Masuk ke akun Anda untuk mengakses ribuan ebook dan fitur lainnya di Esensi Online.`,
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
