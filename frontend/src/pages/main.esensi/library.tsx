import { BookCardLibrary } from "@/components/esensi/book/book-card-library";
import { MainEsensiLayout, current } from "@/components/esensi/layout/layout";
import { PaginationNumber } from "@/components/esensi/navigation/pagination-number";
import { betterAuth } from "@/lib/better-auth";
import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";

export default () => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: true,
    title: "Koleksi",
  };

  // Get page from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const pageFromUrl = parseInt(urlParams.get("page") || "1", 10);

  const local = useLocal(
    {
      loading: true as boolean,
      error: null as string | null,
      list: [] as any[],
      showStatistics: false as boolean,
      statistics: {
        total_ebooks: 0,
        not_started: 0,
        reading: 0,
        completed: 0,
        average_progress: 0,
      },
      pagination: {
        page: pageFromUrl as number,
        limit: 20 as number,
        total: 0 as number,
        totalPages: 0 as number,
        hasNext: false as boolean,
        hasPrev: false as boolean,
        items: 20 as number,
        total_pages: 0 as number,
      },
      filterType: "all" as string,
      authLoading: true as boolean,
    },
    async () => {
      // Wait for authentication to load properly using betterAuth.getSession()
      try {
        const res = await betterAuth.getSession();
        current.user = res.data?.user;
        if (!current.user) return;

        local.authLoading = false;
        local.render();

        // Now load library data
        await loadLibrary();
      } catch (error) {
        console.error("Failed to load session:", error);
        local.authLoading = false;
        local.error = "Gagal memuat sesi pengguna";
        local.loading = false;
        local.render();
      }
    }
  );

  // Function to reload library data
  const loadLibrary = async () => {
    try {
      local.loading = true;
      local.error = null;
      local.render();

      if (!current.user?.idCustomer) {
        local.error =
          "Silakan login terlebih dahulu untuk melihat perpustakaan Anda";
        local.loading = false;
        local.render();
        return;
      }

      const response = await api.user_library({
        id_customer: current.user.idCustomer,
        page: local.pagination.page,
        limit: local.pagination.limit,
        filter_type: local.filterType === "all" ? undefined : local.filterType,
      });

      if (response.success && response.data) {
        local.list = response.data.library.map((item: any) => {
          const authorName = item.ebook.author;

          return {
            id: item.id,
            last_page: item.reading_progress.last_page,
            percent: item.reading_progress.percent,
            last_read: item.reading_progress.last_read,
            name: item.ebook.name,
            cover: item.ebook.cover,
            slug: item.ebook.slug,
            content_type: item.ebook.content_type,
            author: authorName,
            price: item.ebook.price,
            currency: item.ebook.currency,
            description: item.ebook.description,
            can_read: item.can_read,
            reading_status: item.reading_progress.status,
            purchase_date: item.purchase_date,
            from_bundle: item.from_bundle,
            download_info: item.download_info,
            info: [["penulis", authorName]],
          };
        });

        local.statistics = response.data.statistics;
        local.pagination = {
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
          hasNext: response.data.pagination.hasNext,
          hasPrev: response.data.pagination.hasPrev,
          items: response.data.pagination.limit,
          total_pages: response.data.pagination.totalPages,
        };
      } else {
        local.error = response.message || "Gagal memuat perpustakaan";
        local.list = [];
      }
    } catch (error) {
      console.error("Error loading user library:", error);
      local.error = "Terjadi kesalahan saat memuat perpustakaan";
      local.list = [];
    } finally {
      local.loading = false;
      local.render();
    }
  };

  // Function to handle filter change
  const handleFilterChange = (filterType: string) => {
    local.filterType = filterType;
    local.pagination.page = 1; // Reset to first page
    loadLibrary();
  };

  const renderLoading = (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">
        {local.authLoading ? "Memuat sesi..." : "Memuat perpustakaan Anda..."}
      </p>
    </div>
  );

  const renderError = (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-red-500 text-6xl mb-4">📚</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Oops! Terjadi Kesalahan
      </h3>
      <p className="text-gray-600 text-center max-w-md">{local.error}</p>
      <button
        onClick={() => {
          loadLibrary();
        }}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Coba Lagi
      </button>
    </div>
  );

  const renderEmpty = (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-gray-400 text-6xl mb-4">📖</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Perpustakaan Kosong
      </h3>
      <p className="text-gray-600 text-center max-w-md">
        Anda belum memiliki ebook. Jelajahi koleksi kami dan beli ebook pertama
        Anda!
      </p>
      <button
        onClick={() => {
          // Navigate to store
          location.href = "/";
        }}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Jelajahi Ebook
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

    if (!local.list || local.list.length === 0) {
      return renderEmpty;
    }

    const renderList = local.list.map((item, idx) => {
      return <BookCardLibrary data={item} key={`esensi_readbook_${idx}`} />;
    });

    return (
      <div className="flex w-full flex-col lg:flex-row lg:flex-wrap gap-6 lg:gap-y-15 lg:gap-x-0 lg:[&>div]:max-w-1/3 lg:[&>div]:px-10 lg:-mx-10 lg:w-auto">
        {renderList}
      </div>
    );
  };

  const renderPagination = () => {
    if (
      local.authLoading ||
      local.loading ||
      local.error ||
      !local.list ||
      local.list.length === 0
    ) {
      return null;
    }

    return (
      <div className="flex w-full justify-center items-center mt-6 lg:mt-12">
        <PaginationNumber
          items_per_page={local.pagination.items}
          current={local.pagination.page}
          total_pages={local.pagination.total_pages}
          url={"/library"}
        />
      </div>
    );
  };

  const renderStatistics = () => {
    if (
      local.authLoading ||
      local.loading ||
      local.error ||
      !local.statistics ||
      local.statistics.total_ebooks === 0
    ) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Statistik Perpustakaan
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {local.statistics.total_ebooks}
            </div>
            <div className="text-sm text-gray-600">Total Ebook</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {local.statistics.completed}
            </div>
            <div className="text-sm text-gray-600">Selesai</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {local.statistics.reading}
            </div>
            <div className="text-sm text-gray-600">Sedang Dibaca</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {local.statistics.not_started}
            </div>
            <div className="text-sm text-gray-600">Belum Dibaca</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              {local.statistics.average_progress}%
            </div>
            <div className="text-sm text-gray-600">Rata-rata Progress</div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendation = <></>;

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={true}>
      <div className="flex justify-center p-6 lg:py-10 lg:px-0">
        <div className="flex flex-col gap-6 w-full max-w-[1200px] h-auto">
          {local.showStatistics && renderStatistics()}
          {renderContent()}
          {renderPagination()}
          {renderRecommendation}
        </div>
      </div>
    </MainEsensiLayout>
  );
};
