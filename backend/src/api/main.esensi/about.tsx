import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface AboutAPIResponse {
  jsx: ReactElement;
  data: {
    title: string;
    logo: {
      img: string;
      alt: string;
    };
    content: string;
    links: Array<{
      label: string;
      sublabel: string;
      url: string;
      newTab: boolean;
      icon: string;
    }>;
    breadcrumb: Array<{
      url: string | null;
      label: string;
    }>;
  };
}

export default defineAPI({
  name: "about",
  url: "/about",
  async handler(): Promise<AboutAPIResponse> {
    const req = this.req!;

    const logo = {
      img: `img/esensi-online-logo.png`,
      alt: `Esensi Online`,
    };

    const content = `<p>Selamat datang di <strong>Esensi Online</strong>, rumah bagi para pencinta buku digital, penulis independen, dan seluruh pihak yang peduli terhadap pertumbuhan literasi di Indonesia. Sebagai marketplace sekaligus publisher eBook, kami hadir untuk menjembatani karya-karya hebat dengan para pembaca yang haus akan ilmu, wawasan, dan inspirasi.</p>
<p>Tim kami akan berusaha merespons setiap pesan secara cepat dan profesional selama jam kerja. Kami siap membantu Anda dalam setiap tahap. Baik itu proses pembelian, penerbitan, maupun konsultasi konten.</p>
<p>Dengan menjangkau kami, Anda turut berperan dalam membangun literasi untuk Indonesia dan melek digital. Terima kasih telah menjadi bagian dari komunitas <strong>Esensi Online</strong>.</p><p><strong>Esensi Online</strong> adalah platform digital yang hadir untuk mendukung kemajuan literasi di Indonesia melalui penyediaan eBook berkualitas dan kesempatan luas bagi penulis lokal untuk menerbitkan karya mereka secara mandiri dan profesional. Kami berperan ganda sebagai marketplace eBook dan penerbit digital, mempertemukan pembaca dengan berbagai pilihan bacaan yang inspiratif, edukatif, dan relevan dengan perkembangan zaman.</p>
<p>Didirikan dengan semangat untuk menjadikan literasi lebih inklusif dan mudah diakses, Esensi Online membuka ruang bagi siapa saja—baik penulis pemula, profesional, pelajar, guru, hingga komunitas—untuk mempublikasikan karya tulisnya dalam bentuk digital. Kami percaya bahwa setiap orang memiliki cerita, ilmu, dan gagasan berharga yang patut dibagikan kepada dunia.</p>
<p>Melalui platform kami, pembaca dapat menjelajahi berbagai genre eBook, mulai dari fiksi, non-fiksi, pengembangan diri, parenting, hingga karya kreatif lainnya. Semua dapat diakses dengan mudah, kapan pun dan di mana pun, menggunakan perangkat digital.</p>
<p>Di <strong>PT Meraih Ilmu Semesta</strong>, kami percaya bahwa setiap orang memiliki potensi luar biasa untuk berbagi ilmu dan inspirasi melalui tulisan.</p>
<p>Kami hadir untuk membantu para penulis, pemikir, dan profesional dalam mewujudkan ide-ide mereka menjadi karya digital yang dapat dinikmati oleh pembaca di seluruh dunia.</p>
<p>Sebagai perusahaan yang bergerak di bidang penerbitan digital, kami menawarkan solusi lengkap bagi penulis.</p>
<p>Kami percaya bahwa komunikasi yang baik merupakan bagian penting dalam membangun ekosistem literasi digital yang sehat. Oleh karena itu, jika Anda memiliki pertanyaan seputar pembelian eBook, ingin menerbitkan karya Anda secara digital, atau tertarik menjalin kerja sama untuk mendukung gerakan literasi bersama, jangan ragu untuk menghubungi kami.</p>
<p>Kami sangat terbuka terhadap kolaborasi dan masukan, baik dari individu, komunitas, maupun lembaga pendidikan dan literasi. Dukungan Anda, sekecil apa pun, akan sangat berarti dalam misi kami untuk memperluas akses terhadap bacaan berkualitas dan mendorong budaya membaca di era digital.</p>
<p class="esensi-contant-block"><span>Silakan hubungi kami melalui email:</span>
<br/><span>📩 <a href="mailto:info@esensi.online">info@esensi.online</a></span></p>`;

    const links = [
      {
        label: "Email kami",
        sublabel: "info@esensi.online",
        url: "mailto:info@esensi.online",
        newTab: true,
        icon: "mail",
      },
      
    ];

    const data = {
      title: `Empowering Your Talent`,
      logo: logo,
      links: links,
      content: content,
      breadcrumb: [
        {
          url: null,
          label: "About",
        },
      ],
    };

    const seo_data = {
      slug: `/about`,
      meta_title: `Tentang Kami | Penyedia Ebook Terpercaya dan Berkualitas`,
      meta_description: `Informasi tentang kami (Esensi Online) dan bagaimana kami menghadirkan eBook digital terbaik untuk Anda. Komitmen kami adalah memberikan layanan terpercaya dan koleksi eBook berkualitas.`,
      image: ``,
      headings: `Tentang Kami | Penyedia Ebook Terpercaya dan Berkualitas`,
      paragraph: `Informasi tentang kami (Esensi Online) dan bagaimana kami menghadirkan eBook digital terbaik untuk Anda. Komitmen kami adalah memberikan layanan terpercaya dan koleksi eBook berkualitas.`,
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
