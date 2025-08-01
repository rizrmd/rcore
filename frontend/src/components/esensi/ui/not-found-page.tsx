import { navigate } from "@/lib/router";
import { MainEsensiLayout } from "../layout";
import { Button } from "@/components/ui/button";

export const NotFoundPage = () => {
  const header_config = {
    enable: true,
    logo: true,
    back: true,
    search: true,
    title: null,
    cart: true,
    profile: true,
  };

  const notFoundContent = (
    <div className="flex items-center justify-center py-[100px] bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="text-center max-w-lg mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-slate-800 mb-4 animate-pulse">
            404
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-700 mb-4">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Maaf, halaman yang Anda cari tidak dapat ditemukan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors inline-block"
          >
            ← Kembali
          </a>
          <a
            href="/"
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors inline-block"
          >
            🏠 Beranda
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <MainEsensiLayout header_config={header_config}>
      {notFoundContent}
    </MainEsensiLayout>
  );
};

export default NotFoundPage;
