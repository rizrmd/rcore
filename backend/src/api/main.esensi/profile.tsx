import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "profile",
  url: "/profile",
  async handler() {

    const req = this.req!;

    //const uid = this?.session?.user.id;
    const uid = ``;
    let user = null;

    if( uid ){
        user = await db.customer.findFirst({
        where: {
          id: uid,
        },
      });
    }

    const loyality = {
      id: "EO808VX",
      points: 360,
    };

    const data = {
      title: `Informasi Profil`,
      user: user,
      loyality: loyality,
      breadcrumb: [{
        url: null,
        label: `Profile`,
      },],
    };

    const seo_data = {
      slug: `/profile`,
      meta_title: `Profil Saya | Kelola Akun dan Informasi Pembelian Ebook`,
      meta_description: `Kelola profil Anda, ubah informasi akun dengan mudah di halaman ini.`,
      image: ``,
      headings: `Profil Saya | Kelola Akun dan Informasi Pembelian Ebook`,
      paragraph: `Kelola profil Anda, ubah informasi akun dengan mudah di halaman ini.`,
      is_product: false,
    };
    

    return {
      jsx: (<><SeoTemplate data={seo_data} /></>),
      data: data,
    };
  },
});
