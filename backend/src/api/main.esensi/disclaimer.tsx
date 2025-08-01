import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface DisclaimerResponse {
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
  name: "disclaimer",
  url: "/disclaimer",
  async handler(): Promise<DisclaimerResponse> {
    const req = this.req!;

    const content = `<p>Semua informasi di situs web ini - https://esensi.online - dipublikasikan dengan itikad baik dan hanya untuk tujuan informasi umum. Esensi Online tidak memberikan jaminan apa pun tentang kelengkapan, keandalan, dan keakuratan informasi ini. Setiap tindakan yang Anda lakukan atas informasi yang Anda temukan di situs web ini (Esensi Online), sepenuhnya merupakan risiko Anda sendiri. Esensi Online tidak akan bertanggung jawab atas kerugian dan / atau kerusakan sehubungan dengan penggunaan situs web kami.</p>
<p>Dari situs web kami, Anda dapat mengunjungi situs web lain dengan mengikuti hyperlink ke situs eksternal tersebut. Meskipun kami berusaha keras untuk hanya menyediakan tautan berkualitas ke situs web yang bermanfaat dan etis, kami tidak memiliki kendali atas konten dan sifat situs-situs ini. Tautan ke situs web lain ini tidak menyiratkan rekomendasi untuk semua konten yang ditemukan di situs-situs ini. Pemilik situs dan konten dapat berubah tanpa pemberitahuan dan dapat terjadi sebelum kami memiliki kesempatan untuk menghapus tautan yang mungkin telah 'buruk'.</p>
<p>Perlu diketahui juga bahwa ketika Anda meninggalkan situs web kami, situs-situs lain mungkin memiliki kebijakan privasi dan ketentuan yang berbeda yang berada di luar kendali kami. Pastikan untuk memeriksa Kebijakan Privasi situs-situs ini serta "Ketentuan Layanan" mereka sebelum terlibat dalam bisnis apa pun atau mengunggah informasi apa pun.</p>
<h2>Persetujuan</h2>
<p>Dengan menggunakan situs web kami, Anda dengan ini menyetujui disclaimer kami dan menyetujui persyaratannya.</p>
<h2>Pembaruan</h2>
<p>Jika kami memperbarui, mengubah, atau membuat perubahan apa pun pada dokumen ini, perubahan tersebut akan diposting secara jelas di sini.</p>
<p>Jika Anda memerlukan informasi lebih lanjut atau memiliki pertanyaan tentang disclaimer situs kami, jangan ragu untuk menghubungi kami melalui email di info@esensi.online.</p>`;

    const data = {
      title: `Disclaimer`,
      content: content,
      breadcrumb: [
        {
          url: null,
          label: "Disclaimer",
        },
      ],
    };

    const seo_data = {
      slug: `/disclaimer`,
      meta_title: `Disclaimer | Informasi Penting dan Batas Tanggung Jawab`,
      meta_description: `Halaman Disclaimer Esensi Online menjelaskan batas tanggung jawab atas konten digital, penjualan ebook, serta hak dan kewajiban pengguna dalam menggunakan layanan kami sebagai marketplace dan penerbit.`,
      image: ``,
      headings: `Disclaimer`,
      h1: `Disclaimer`,
      h2: `Tentang Esensi Online`,
      h3: `Batas Tanggung Jawab atas Konten`,
      h4: `Peran Kami sebagai Marketplace dan Publisher`,
      h5: `Informasi Produk Digital`,
      paragraph: `Esensi Online adalah platform marketplace dan penerbit digital yang menyediakan berbagai ebook dari beragam penulis. Halaman ini menjelaskan bahwa kami tidak bertanggung jawab atas ketepatan, kelengkapan, atau penggunaan informasi dalam ebook yang tersedia. Pengguna diharapkan membaca deskripsi produk secara saksama sebelum melakukan pembelian. Esensi Online berhak memperbarui syarat layanan tanpa pemberitahuan sebelumnya.`,
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
