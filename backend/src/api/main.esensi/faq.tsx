import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface FAQResponse {
  jsx: ReactElement;
  data: {
    title: string;
    content: string;
    list: Array<{
      q: string;
      a: string;
    }>;
    breadcrumb: Array<{
      url: string | null;
      label: string;
    }>;
  };
}

export default defineAPI({
  name: "faq",
  url: "/faq",
  async handler(): Promise<FAQResponse> {
    const req = this.req!;

    const content = `<p>Selamat datang di halaman FAQ Esensi Online. Berikut adalah beberapa pertanyaan umum beserta jawabannya untuk membantu Anda memahami layanan kami.</p>`;

    const list = [
      {
        q: `Apa itu Esensi Online?`,
        a: `Esensi Online merupakan sebuah platform yang membantu mempublikasikan karya tulis kamu secara digital sebagai ebook.`,
      },
      {
        q: `Apakah saya dapat menulis buku saya sendiri di Esensi Online?`,
        a: `Ya, tentu saja bisa.`,
      },
      {
        q: `Ke mana saya bisa menghubungi Esensi Online untuk informasi yang lebih lanjut?`,
        a: `Kamu dapat menghubungi kami melalui email info@esensi.online`,
      },
    ];

    const data = {
      title: `Pertanyaan Yang Sering Diajukan`,
      content: content,
      list: list,
      breadcrumb: [
        {
          url: null,
          label: "FAQs",
        },
      ],
    };

    const seo_data = {
      slug: `/faq`,
      meta_title: `FAQs | Esensi Online - Pertanyaan Umum Seputar Ebook & Layanan`,
      meta_description: `Temukan jawaban atas pertanyaan umum tentang pembelian ebook, cara mengunduh, metode pembayaran, akun pengguna, dan layanan penerbitan di Esensi Online.`,
      image: ``,
      headings: `Pertanyaan yang Sering Diajukan (FAQs)`,
      h1: `Pertanyaan yang Sering Diajukan (FAQs)`,
      h2: `Pembelian & Pengunduhan Ebook`,
      h3: `Bagaimana cara membeli ebook di Esensi Online?`,
      h4: `Apakah saya bisa mengakses ebook di berbagai perangkat?`,
      h5: `Bagaimana cara menjadi penulis atau mitra di Esensi Online?`,
      h6: `Berapa lama proses review buku?`,
      paragraph: `Halaman FAQs Esensi Online membantu menjawab berbagai pertanyaan umum seputar proses pembelian, pengunduhan ebook, pembuatan akun, metode pembayaran, hingga informasi untuk penulis yang ingin menerbitkan karyanya. Dirancang untuk memudahkan pengalaman pengguna, silakan cari jawaban sebelum menghubungi tim dukungan kami.`,
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
