import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface HowToBuyResponse {
  jsx: ReactElement;
  data: {
    title: string;
    content: string;
    breadcrumb: Array<{
      url: string | null;
      label: string;
    }>;
  };
}

export default defineAPI({
  name: "howtobuy",
  url: "/how-to-buy",
  async handler(): Promise<HowToBuyResponse> {
    const req = this.req!;

    const content = ``;

    const data = {
      title: `Cara Pembelian`,
      content: content,
      breadcrumb: [
        {
          url: null,
          label: "Cara Pembelian",
        },
      ],
    };

    const seo_data = {
      slug: `/how-to-buy`,
      meta_title: `Cara Pembelian Ebook | Esensi Online - Panduan Lengkap & Mudah`,
      meta_description: `Pelajari langkah-langkah mudah membeli ebook di Esensi Online. Ikuti panduan lengkap mulai dari memilih produk, pembayaran, hingga proses pengunduhan ebook.`,
      image: ``,
      headings: `Cara Membeli Ebook di Esensi Online`,
      paragraph: `Esensi Online memberikan proses pembelian ebook yang praktis dan aman. Dalam halaman ini, Anda dapat mengikuti panduan langkah demi langkah untuk memilih, membayar, dan mengunduh ebook digital pilihan Anda. Semua transaksi dilakukan secara online dan mendukung berbagai metode pembayaran populer di Indonesia.`,
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
