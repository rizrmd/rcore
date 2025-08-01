import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "tos",
  url: "/tos",
  async handler() {

    const req = this.req!;

    const content = `<p><em>Terakhir diperbarui: 30 Juni 2025</em></p>
<p>Harap membaca Syarat dan Ketentuan ini dengan saksama sebelum menggunakan situs Esensi Online. Dengan mengakses dan menggunakan layanan kami, Anda dianggap telah memahami dan menyetujui seluruh ketentuan yang berlaku.</p>
<h2>1. Definisi</h2>
<ul>
<li><strong>"Kami"</strong> mengacu pada Esensi Online (<a href="https://esensi.online/">https://esensi.online</a>).</li>
<li><strong>"Pengguna"</strong> adalah setiap individu yang mengakses atau menggunakan layanan kami.</li>
<li><strong>"Layanan"</strong> mengacu pada semua fitur, konten, dan produk digital yang tersedia di situs ini.</li>
</ul>
<h2>2. Pendaftaran dan Akun</h2>
<ul>
<li>Untuk menggunakan layanan tertentu, Anda mungkin diminta untuk mendaftar dan memberikan informasi pribadi seperti nama, email, dan nomor HP.</li>
<li>Anda bertanggung jawab menjaga keamanan akun Anda, termasuk kata sandi yang digunakan untuk mengakses situs.</li>
</ul>
<h2>3. Ketentuan Penggunaan</h2>
<ul>
<li>Pengguna setuju untuk menggunakan situs secara sah dan tidak untuk tujuan yang melanggar hukum, menipu, atau merugikan pihak lain.</li>
<li>Dilarang keras menyebarkan konten yang mengandung unsur SARA, pornografi, hoaks, atau melanggar hak kekayaan intelektual.</li>
</ul>
<h2>4. Hak Kekayaan Intelektual</h2>
<ul>
<li>Semua konten yang tersedia di Esensi Online, termasuk namun tidak terbatas pada teks, gambar, desain, dan ebook, dilindungi oleh hak cipta dan tidak boleh diduplikasi tanpa izin tertulis dari kami, penulis, ataupun pemilik lisensinya.</li>
</ul>
<h2>5. Pembelian dan Lisensi Digital</h2>
<ul>
<li>Ebook yang dibeli di Esensi Online bersifat digital dan hanya untuk penggunaan pribadi, non-komersial.</li>
<li>Pengguna tidak diperkenankan mendistribusikan ulang atau menjual ulang konten digital tanpa izin tertulis dari pihak Esensi Online/Penerbit, maupun penulis.</li>
</ul>
<h2>6. Pembatalan dan Pengembalian Dana</h2>
<ul>
<li>Karena sifat produk digital, semua pembelian bersifat final dan tidak dapat dikembalikan kecuali ada kesalahan teknis yang berasal dari pihak kami.</li>
</ul>
<h2>7. Perubahan Layanan</h2>
<p>Kami berhak untuk menambah, mengubah, atau menghentikan sebagian atau seluruh layanan kami kapan saja tanpa pemberitahuan sebelumnya.</p>
<h2>8. Tanggung Jawab Pengguna</h2>
<ul>
<li>Pengguna bertanggung jawab penuh atas aktivitas yang dilakukan melalui akunnya.</li>
<li>Esensi Online tidak bertanggung jawab atas kerugian yang disebabkan oleh penggunaan akun oleh pihak ketiga tanpa izin.</li>
</ul>
<h2>9. Batasan Tanggung Jawab</h2>
<p>Kami berusaha menyediakan layanan sebaik mungkin, namun kami tidak menjamin bahwa layanan akan selalu bebas dari gangguan, kesalahan, atau bebas virus. Esensi Online tidak bertanggung jawab atas kerugian langsung maupun tidak langsung akibat penggunaan situs ini.</p>
<h2>10. Hukum yang Berlaku</h2>
<p>Syarat dan Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia. Segala sengketa yang timbul akan diselesaikan melalui jalur musyawarah atau sesuai proses hukum yang berlaku.</p>
<h2>11. Kontak</h2>
<p>Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami:</p>
<ul class="no-list-style">
<li>📧 Email: <a href="mailto:info@esensi.online">info@esensi.online</a></li>
<li>🌐 Website: <a href="https://esensi.online/">https://esensi.online</a></li>
</ul>`;


    const data = {
      title: `Syarat dan Ketentuan Pengguna`,
      content: content,
      breadcrumb: [{
        url: null,
        label: "Terms of Service",
      }],
    };

    const seo_data = {
      slug: `/tos`,
      meta_title: `Syarat dan Ketentuan Layanan | Esensi Online - Ketentuan Penggunaan Platform`,
      meta_description: `Baca Syarat dan Ketentuan Esensi Online untuk memahami aturan penggunaan platform, hak dan kewajiban pengguna, serta kebijakan terkait pembelian dan penerbitan ebook.`,
      image: ``,
      headings: `Syarat dan Ketentuan Layanan`,
      paragraph: `Halaman ini memuat Syarat dan Ketentuan yang mengatur penggunaan layanan di Esensi Online, baik sebagai pembeli maupun penulis. Dengan mengakses atau menggunakan platform kami, Anda dianggap telah menyetujui seluruh kebijakan, termasuk penggunaan akun, pembelian ebook, serta hak dan tanggung jawab terkait penerbitan digital.`,
      is_product: false,
    };

    return {
      jsx: (<><SeoTemplate data={seo_data} /></>),
      data: data,
    };
  },
});
