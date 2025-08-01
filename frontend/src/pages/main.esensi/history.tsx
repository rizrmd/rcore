import { HelpSidebar } from "@/components/esensi/ui/help-sidebar";
import { MainEsensiLayout, current } from "@/components/esensi/layout/layout";
import { PaginationNumber } from "@/components/esensi/navigation/pagination-number";
import { TransactionCard } from "@/components/esensi/transaction/transaction-card";
import { TrxFilterTabs } from "@/components/esensi/transaction/trx-filter-tabs";
import { betterAuth } from "@/lib/better-auth";
import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { AlertCircle, ShoppingBag } from "lucide-react";

export default () => {
  // Get filter and page from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const filterFromUrl = urlParams.get("status") || "semua";
  const pageFromUrl = parseInt(urlParams.get("page") || "1", 10);

  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Riwayat Transaksi",
    cart: true,
    profile: true,
  };

  const local = useLocal(
    {
      loading: true as boolean,
      error: null as string | null,
      transactions: [] as any[],
      pagination: {
        page: pageFromUrl,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      filter_stats: [] as any[],
      currentFilter: filterFromUrl as string,
      authLoading: true as boolean,
    },
    async () => {
      try {
        const res = await betterAuth.getSession();
        current.user = res.data?.user;

        local.authLoading = false;
        local.render();

        if (!current.user) {
          local.error =
            "Silakan login terlebih dahulu untuk melihat riwayat transaksi";
          local.loading = false;
          local.render();
          return;
        }

        await loadTransactions();

        // Listen for browser back/forward navigation
        const handlePopState = () => {
          const urlParams = new URLSearchParams(window.location.search);
          const newFilter = urlParams.get("status") || "semua";
          const newPage = parseInt(urlParams.get("page") || "1", 10);

          if (
            newFilter !== local.currentFilter ||
            newPage !== local.pagination.page
          ) {
            local.currentFilter = newFilter;
            local.pagination.page = newPage;
            loadTransactions(newFilter, newPage);
          }
        };

        window.addEventListener("popstate", handlePopState);

        // Cleanup event listener when component unmounts
        return () => {
          window.removeEventListener("popstate", handlePopState);
        };
      } catch (error) {
        console.error("Failed to load session:", error);
        local.authLoading = false;
        local.error = "Gagal memuat sesi pengguna";
        local.loading = false;
        local.render();
      }
    }
  );

  const loadTransactions = async (filter?: string, page?: number) => {
    try {
      local.loading = true;
      local.error = null;
      local.render();

      if (!current.user) {
        local.error = "User tidak ditemukan";
        local.loading = false;
        local.render();
        return;
      }

      const response = await (api as any).history({
        user: current.user,
        filter: filter || local.currentFilter,
        page: page || local.pagination.page,
        limit: local.pagination.limit,
      });

      if (response.success && response.data) {
        local.transactions = response.data.transactions || [];
        local.pagination = response.data.pagination || local.pagination;
        local.filter_stats = response.data.filter_stats || [];
      } else {
        local.error = response.message || "Gagal memuat riwayat transaksi";
        local.transactions = [];
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      local.error = "Terjadi kesalahan saat memuat riwayat transaksi";
      local.transactions = [];
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const handleFilterChange = async (filter: string) => {
    local.currentFilter = filter;
    local.pagination.page = 1; // Reset to first page when changing filter
    await loadTransactions(filter, 1);

    // Update URL without page reload
    const newUrl = `/history?status=${filter}`;
    window.history.pushState({}, "", newUrl);
  };

  const renderLoading = (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B2C93]"></div>
      <p className="mt-4 text-gray-600">
        {local.authLoading ? "Memuat sesi..." : "Memuat riwayat transaksi..."}
      </p>
    </div>
  );

  const renderError = (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Oops! Terjadi Kesalahan
      </h3>
      <p className="text-gray-600 text-center max-w-md">{local.error}</p>
      <button
        onClick={() => {
          window.location.reload();
        }}
        className="mt-4 px-6 py-2 bg-[#3B2C93] text-white rounded-lg hover:bg-[#2d1f6b] transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );

  const renderEmpty = (
    <div className="flex flex-col items-center justify-center py-20">
      <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Belum Ada Transaksi
      </h3>
      <p className="text-gray-600 text-center max-w-md">
        Anda belum memiliki riwayat transaksi. Mulai berbelanja ebook favorit
        Anda sekarang!
      </p>
      <button
        onClick={() => {
          window.location.href = "/";
        }}
        className="mt-4 px-6 py-2 bg-[#3B2C93] text-white rounded-lg hover:bg-[#2d1f6b] transition-colors"
      >
        Mulai Berbelanja
      </button>
    </div>
  );

  const renderContent = () => {
    if (local.authLoading || local.loading) {
      return renderLoading;
    }

    if (local.error) {
      return renderError;
    }

    if (!local.transactions || local.transactions.length === 0) {
      return renderEmpty;
    }

    return (
      <div className="flex flex-col gap-3">
        {local.transactions.map((transaction, index) => (
          <TransactionCard
            key={`transaction_${transaction.id}_${index}`}
            data={transaction}
          />
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (
      local.authLoading ||
      local.loading ||
      local.error ||
      !local.transactions ||
      local.transactions.length === 0 ||
      local.pagination.totalPages <= 1
    ) {
      return null;
    }

    return (
      <div className="flex w-full justify-center items-center mt-8">
        <PaginationNumber
          items_per_page={local.pagination.limit}
          current={local.pagination.page}
          total_pages={local.pagination.totalPages}
          url={{
            prefix: `/history?status=${local.currentFilter}&page=`,
            suffix: "",
          }}
        />
      </div>
    );
  };

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={true}>
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="flex justify-center py-6 lg:py-10 px-4 lg:px-0">
          <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1200px]">
            {/* Main content */}
            <div className="flex-1 lg:w-2/3">
              <div>
                {/* Filter tabs */}
                <TrxFilterTabs
                  current={local.currentFilter}
                  filter_stats={local.filter_stats}
                  onFilterChange={handleFilterChange}
                />

                {/* Transactions list */}
                <div className="py-3">
                  {renderContent()}
                  {renderPagination()}
                </div>
              </div>
            </div>

            {/* Help sidebar - only visible on desktop */}
            <div className="hidden lg:block lg:w-1/3 lg:max-w-[350px]">
              <HelpSidebar />
            </div>
          </div>
        </div>
      </div>
    </MainEsensiLayout>
  );
};
