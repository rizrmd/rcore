import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "profileedit",
  url: "/profile/edit",
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

    const data = {
      title: `Edit Profil`,
      user: user,
    };

    const seo_data = {
      slug: `/profile`,
      meta_title: `Edit Profil Saya | Kelola Akun dan Informasi Pribadi Anda`,
      meta_description: `Kelola Akun dan Informasi Pribadi Anda dengan Mudah`,
      image: ``,
      headings: `Edit Profil Saya | Kelola Akun dan Informasi Pribadi Anda`,
      paragraph: `Kelola Akun dan Informasi Pribadi Anda dengan Mudah`,
      is_product: false,
    };
    

    return {
      jsx: (<><SeoTemplate data={seo_data} /></>),
      data: data,
    };
  },
});
