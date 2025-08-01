import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { Link } from "@/lib/router";

export default () => {
  const header_config = {
    enable: true,
    logo: true,
    back: false,
    search: true,
    title: null,
    cart: true,
    profile: true,
  };

  return (
    <MainEsensiLayout header_config={header_config}>
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <h1 className="text-3xl font-bold text-[#3B2C93] mb-4">Genre</h1>
        <p className="text-gray-600 text-center mb-8">
          Pilih genre untuk melihat koleksi buku berdasarkan kategori yang Anda inginkan.
        </p>
        <Link 
          href="/" 
          className="bg-[#3B2C93] text-white px-6 py-3 rounded-lg hover:bg-[#2a1f6f] transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </MainEsensiLayout>
  );
};