import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import type { api } from "@/lib/gen/main.esensi";
import { Link } from "@/lib/router";
import { Book, Receipt, Bookmark, MapPin } from "lucide-react";


export default (data: Awaited<ReturnType<typeof api.profile>>["data"]) => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Profile",
    cart: true,
    profile: true,
  };

  const local = {
    loading: true as boolean,
    user: null as any | null,
    royality: null as any | null,
  };

  if (data?.user) {
    local.user = data.user;
  }
  if (data?.loyality) {
    local.royality = data.loyality;
  }
  local.loading = false;

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={true}>
      <div className="flex justify-center p-6 lg:bg-[#E1E5EF] lg:py-10 lg:px-0">
        <div className="flex flex-col w-full h-full max-w-[1200px]">
          <div className="flex flex-col gap-4 w-full h-auto lg:py-6 lg:px-8">
            
            {/* Welcome Greeting Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 mb-2">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  Selamat datang kembali{(local.user?.name && `, ${local.user.name}`) || ''}! 👋
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Senang melihat Anda kembali! Mari jelajahi koleksi ebook terbaru dan kelola aktivitas membaca Anda di Esensi Online. 
                  Nikmati pengalaman membaca digital yang tak terbatas! 📚✨
                </p>
              </div>
            </div>
            
            {/* Profile Menu Boxes */}
            <div className="flex flex-col md:flex-row gap-4">
              
              {/* Ebook Library Box */}
              <Link href="/library" className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between gap-2 lg:gap-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Book className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Ebook Library</h3>
                      <p className="text-sm text-gray-500">Koleksi ebook Anda</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {local.user?.owned_books_count || 0}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Transactions Box */}
              <Link href="/history" className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between gap-2 lg:gap-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Receipt className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Transactions</h3>
                      <p className="text-sm text-gray-500">Riwayat pembelian</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {local.user?.transaction_count || 0}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Wishlist Box */}
              <div className="hidden bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between gap-2 lg:gap-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Bookmark className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Wishlist</h3>
                      <p className="text-sm text-gray-500">Daftar keinginan</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {local.user?.wishlist_count || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alamat Box */}
              <Link href="/address" className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between gap-2 lg:gap-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <MapPin className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Alamat</h3>
                      <p className="text-sm text-gray-500">Kelola alamat Anda</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      
                    </div>
                  </div>
                </div>
              </Link>

            </div>

            {/* User Profile Information Section */}
            {local.user && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Profil</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nama</label>
                    <p className="text-gray-900">{local.user.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{local.user.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{local.user.phone || '-'}</p>
                  </div>
                  {local.royality && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Loyalty Points</label>
                      <p className="text-gray-900">{local.royality.points || 0} poin</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainEsensiLayout>
  );
};
