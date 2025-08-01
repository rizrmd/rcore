import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "privacypolicy",
  url: "/privacy-policy",
  async handler() {
    const req = this.req!;

    const content = `<p><em>Terakhir diperbarui: 30 Juni 2025</em></p>
<p>Selamat datang di <strong>Esensi Online</strong> (<a href="https://esensi.online/">https://esensi.online</a>). Kami berkomitmen untuk melindungi privasi dan keamanan informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data yang Anda berikan kepada kami saat menggunakan layanan kami.</p>
<h2>1. Informasi yang Kami Kumpulkan</h2>
<p>Saat Anda menggunakan situs Esensi Online, kami dapat mengumpulkan informasi pribadi berikut:</p>
<ul>
<li>Nama lengkap</li>
<li>Nomor handphone (HP)</li>
<li>Alamat email</li>
</ul>
<p>Informasi ini dikumpulkan saat Anda mendaftar, membeli produk, atau menggunakan fitur tertentu di situs kami.</p>
<h2>Tujuan Penggunaan Data</h2>
<p>Data pribadi yang Anda berikan akan digunakan untuk:</p>
<ul>
<li>Mengelola akun pengguna dan memberikan akses ke fitur situs</li>
<li>Mengirim informasi terkait produk, promosi, atau konten literasi digital</li>
<li>Memberikan dukungan pelanggan dan menanggapi pertanyaan Anda</li>
<li>Meningkatkan pengalaman pengguna di platform kami</li>
</ul>
<p>Kami tidak menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga tanpa izin Anda, kecuali diwajibkan oleh hukum.</p>
<h2>3. Perlindungan Data</h2>
<p>Kami menggunakan langkah-langkah teknis dan organisasi yang wajar untuk melindungi data pribadi Anda dari akses tidak sah, pengungkapan, perubahan, atau penghancuran.</p>
<h2>4. Hak Pengguna</h2>
<p>Sebagai pengguna, Anda memiliki hak untuk:</p>
<ul>
<li>Mengakses data pribadi yang telah Anda berikan</li>
<li>Meminta perbaikan atau penghapusan data Anda</li>
<li>Menarik persetujuan atas penggunaan data kapan saja</li>
</ul>
<p>Untuk menggunakan hak-hak ini, silakan hubungi kami melalui email: <a href="mailto:info@esensi.online">info@esensi.online</a></p>
<h2>5. Cookie dan Pelacakan</h2>
<p>Esensi Online dapat menggunakan cookie dan teknologi pelacakan lainnya untuk meningkatkan kenyamanan Anda saat menggunakan situs kami. Cookie membantu kami memahami perilaku pengguna dan menyesuaikan konten yang relevan.</p>
<h2>6. Perubahan Kebijakan</h2>
<p>Kebijakan Privasi ini dapat diperbarui dari waktu ke waktu. Setiap perubahan signifikan akan diinformasikan melalui situs kami atau melalui email. Kami menganjurkan Anda untuk meninjau halaman ini secara berkala.</p>
<h2>7. Informasi Kontak</h2>
<p>Jika Anda memiliki pertanyaan atau keluhan terkait privasi dan perlindungan data, silakan hubungi kami di:</p>
<ul class="no-list-style">
<li>📧 Email: <a href="mailto:info@esensi.online">info@esensi.online</a></li>
<li>🌐 Website: <a href="https://esensi.online/">https://esensi.online</a></li>
</ul>`;

    const data = {
      title: `Kebijakan Privasi`,
      content: content,
      breadcrumb: [
        {
          url: null,
          label: "Kebijakan Privasi",
        },
      ],
    };

    const seo_data = {
      slug: `/privacypolicy`,
      meta_title: `Kebijakan Privasi | Esensi Online - Perlindungan Data Pengguna`,
      meta_description: `Baca Kebijakan Privasi Esensi Online untuk mengetahui bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan layanan marketplace dan penerbitan ebook kami.`,
      image: ``,
      headings: `Kebijakan Privasi`,
      h1: `Kebijakan Privasi`,
      h2: `Komitmen Kami terhadap Privasi Anda`,
      h3: `Informasi yang Kami Kumpulkan`,
      h4: `Cara Penggunaan Data Pribadi`,
      h5: `Perlindungan & Keamanan Data`,
      h6: `Hak Pengguna dan Pembaruan Kebijakan`,
      paragraph: `Esensi Online berkomitmen untuk menjaga privasi pengguna kami. Melalui halaman Kebijakan Privasi ini, kami menjelaskan cara pengumpulan, penggunaan, dan perlindungan informasi pribadi saat Anda menjelajahi atau melakukan transaksi ebook di platform kami. Dengan menggunakan layanan Esensi Online, Anda menyetujui praktik pengelolaan data yang kami terapkan.`,
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
