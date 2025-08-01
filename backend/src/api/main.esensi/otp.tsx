import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
    name: "otp",
    url: "/otp",
    async handler() {

        const req = this.req!;

        const data = {
            title: `Verifikasi Akun Anda`,
            phone: ``,
            content: {},
        };

        const seo_data = {
            slug: `/otp`,
            meta_title: `Verifikasi Akun Anda | Masukkan Kode OTP`,
            meta_description: `Masukkan kode OTP yang telah dikirimkan ke email Anda untuk memverifikasi akun.`,
            image: ``,
            headings: `Verifikasi Akun Anda | Masukkan Kode OTP`,
            paragraph: `Masukkan kode OTP yang telah dikirimkan ke email Anda untuk memverifikasi akun.`,
            is_product: false,
        };

        return {
            jsx: (<><SeoTemplate data={seo_data} /></>),
            data: data,
          };
    },
});
