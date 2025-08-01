import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface ContactResponse {
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
  name: "contact",
  url: "/contact",
  async handler(): Promise<ContactResponse> {
    const req = this.req!;

    const content = `<p>Selamat datang di <strong>Esensi Online</strong>, rumah bagi para pencinta buku digital, penulis independen, dan seluruh pihak yang peduli terhadap pertumbuhan literasi di Indonesia. Sebagai marketplace sekaligus publisher eBook, kami hadir untuk menjembatani karya-karya hebat dengan para pembaca yang haus akan ilmu, wawasan, dan inspirasi.</p>
<p>Kami percaya bahwa komunikasi yang baik merupakan bagian penting dalam membangun ekosistem literasi digital yang sehat. Oleh karena itu, jika Anda memiliki pertanyaan seputar pembelian eBook, ingin menerbitkan karya Anda secara digital, atau tertarik menjalin kerja sama untuk mendukung gerakan literasi bersama, jangan ragu untuk menghubungi kami.</p>
<p>Kami sangat terbuka terhadap kolaborasi dan masukan, baik dari individu, komunitas, maupun lembaga pendidikan dan literasi. Dukungan Anda, sekecil apa pun, akan sangat berarti dalam misi kami untuk memperluas akses terhadap bacaan berkualitas dan mendorong budaya membaca di era digital.</p>
<p class="esensi-contant-block"><span>Silakan hubungi kami melalui email:</span>
<br/><span>📩 <a href="mailto:info@esensi.online">info@esensi.online</a></span></p>
<p>Tim kami akan berusaha merespons setiap pesan secara cepat dan profesional selama jam kerja. Kami siap membantu Anda dalam setiap tahap. Baik itu proses pembelian, penerbitan, maupun konsultasi konten.</p>
<p>Dengan menjangkau kami, Anda turut berperan dalam membangun literasi untuk Indonesia dan melek digital. Terima kasih telah menjadi bagian dari komunitas <strong>Esensi Online</strong>.</p>`;

    const data = {
      title: `Hubungi Kami`,
      content: content,
      breadcrumb: [
        {
          url: null,
          label: `Contact`,
        },
      ],
    };

    const seo_data = {
      slug: `/contact`,
      meta_title: `Hubungi Kami | Bantuan & Dukungan Pelanggan`,
      meta_description: `Ada pertanyaan atau butuh bantuan seputar pembelian atau unduhan eBook? Tim kami siap membantu Anda.`,
      image: ``,
      headings: `Hubungi Kami | Bantuan & Dukungan Pelanggan`,
      paragraph: `Ada pertanyaan atau butuh bantuan seputar pembelian atau unduhan eBook? Tim kami siap membantu Anda.`,
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
