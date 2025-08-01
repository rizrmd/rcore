import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { PaginationNumber } from "@/components/esensi/navigation/pagination-number";
import { ShipmentCard } from "@/components/esensi/shipment/shipment-card";
import { ShipmentFilterTabs } from "@/components/esensi/shipment/shipment-filter-tabs";
import { ShipmentHelpLinks } from "@/components/esensi/shipment/shipment-help-links";
import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { useEffect, useRef } from "react";

// Define a clear type for the data returned by the API for the list view.
type ShipmentListData = {
  shipments: {
    id: string;
    orderId: string;
    date: string;
    status: string;
    courier: string;
    awb: string | null;
    items: { name: string; cover: string }[];
  }[];
  pagination: {
    current_page: number;
    total_pages: number;
    items_per_page: number;
    total_items: number;
    status: string;
  } | null;
};

// Define the expected prop type for this page component.
type PageProps = {
  data: ShipmentListData | null;
}

export default ({ data: initialData }: PageProps) => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Daftar Pengiriman",
    cart: true,
    profile: true,
  };

  // --- HOOKS MUST BE CALLED AT THE TOP LEVEL ---
  const abortControllerRef = useRef<AbortController | null>(null);

  const local = useLocal({
    // Initialize with data from props, or empty state if not available.
    shipments: initialData?.shipments || [],
    pagination: initialData?.pagination || null,
    activeFilter: initialData?.pagination?.status || "semua",
    // Start in a loading state if no initial data is provided.
    isLoading: !initialData,
  });

  // --- END OF HOOKS ---

  /**
   * Centralized data fetching function to handle race conditions with AbortController.
   */
  const fetchData = async (page: number, status: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Only set loading to true if it's not already true
    if (!local.isLoading) {
      local.isLoading = true;
      local.render();
    }

    try {
      const response = await api.shipment({
        query: { page: String(page), status },
        // @ts-ignore - Assuming the underlying fetch supports a signal
        signal: signal,
      });
      
      const newData = response.data as ShipmentListData;
      
      local.shipments = newData?.shipments || [];
      local.pagination = newData?.pagination || null;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Fetch aborted");
      } else {
        console.error("Failed to fetch data:", error);
        local.shipments = [];
        local.pagination = null;
      }
    } finally {
      local.isLoading = false;
      local.render();
    }
  };
  
  // --- EFFECT HOOKS ---
  // This effect runs once on mount. If the page loads without server-side data,
  // it triggers the initial client-side fetch.
  useEffect(() => {
    if (!initialData) {
      fetchData(1, 'semua');
    }
    // Cleanup function to abort request if component unmounts.
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []); // Empty dependency array ensures this runs only once.


  const handleFilterChange = (newFilter: string) => {
    if (local.isLoading) return;

    local.activeFilter = newFilter;
    const newUrl = `/shipment?status=${newFilter}&page=1`;
    window.history.pushState({}, '', newUrl);
    fetchData(1, newFilter);
  };

  const handlePageChange = (newPage: number) => {
    if (local.isLoading || newPage === local.pagination?.current_page) {
      return;
    }
    
    if (local.pagination) {
        local.pagination.current_page = newPage;
    }

    const newUrl = `/shipment?status=${local.activeFilter}&page=${newPage}`;
    window.history.pushState({}, '', newUrl);
    fetchData(newPage, local.activeFilter);
  };

  const renderLoading = (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-[#3B2C93]"></div>
      <p className="mt-4 text-gray-600">Memuat riwayat pengiriman...</p>
    </div>
  );

  // Note: getStatusLabel has been moved to ShipmentCard, but is kept here for filterStats.
  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: "Menunggu Konfirmasi",
      unpaid: "Menunggu Pembayaran",
      waiting: "Siap Dikirim",
      shipping: "Dalam Pengiriman",
      delivered: "Telah Diterima",
      canceled: "Dibatalkan",
    };
    return labels[status] || status;
  }

  const tabKeys = ["waiting", "shipping", "delivered", "canceled", "pending", "unpaid"];
  const filterStats = [
    { key: "semua", label: "Semua", count: local.pagination?.total_items || 0 },
    ...tabKeys.map((key) => ({
      key,
      label: getStatusLabel(key),
      count: 0, // Note: API would need to provide counts for this to be accurate
    })),
  ];
  
  const renderShipmentList = (
    <div className="flex flex-col gap-4">
      {local.shipments.map((shipment) => (
        <ShipmentCard key={shipment.id} shipment={shipment} />
      ))}
    </div>
  );

  const renderEmptyState = (
    <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-8 text-center border border-gray-100">
      <h3 className="text-xl font-bold text-[#3B2C93] mb-2">Belum Ada Pengiriman</h3>
      <p className="text-gray-600">Tidak ada pengiriman dengan status ini.</p>
    </div>
  );
  
  const MainContent = () => {
    if (local.shipments.length > 0) {
      return renderShipmentList;
    }
    if (!local.isLoading) {
      return renderEmptyState;
    }
    // Render nothing while loading, parent handles the visual indicator
    return null;
  }

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={true}>
      <div className="flex flex-col justify-center items-start bg-[#E1E5EF] lg:items-center lg:py-10">
        <div className="flex flex-col w-full max-w-[1200px] gap-6 mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-6">
            <div className="flex flex-col gap-4 my-6 w-full lg:w-auto lg:flex-1 px-4 lg:px-0">
              {local.isLoading && local.shipments.length === 0 ? (
                renderLoading
              ) : (
                <>
                  <ShipmentFilterTabs
                    current={local.activeFilter}
                    filter_stats={filterStats}
                    onFilterChange={handleFilterChange}
                  />
                  <div className={`min-h-[300px] transition-opacity duration-300 ${local.isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    <MainContent />
                  </div>
                  {local.pagination && local.pagination.total_pages > 1 && (
                    <div 
                      className="mt-8"
                      onClick={(e) => {
                        if (local.isLoading) {
                            e.preventDefault();
                            return;
                        }
                        const target = (e.target as HTMLElement).closest('a');
                        if (!target) return;

                        e.preventDefault();
                        
                        try {
                          const url = new URL(target.href);
                          const newPage = url.searchParams.get('page');
                          if (newPage && !isNaN(Number(newPage))) {
                            handlePageChange(Number(newPage));
                          }
                        } catch (error) {
                          console.error("Could not parse pagination URL:", error);
                        }
                      }}
                    >
                      <PaginationNumber
                        current={local.pagination.current_page}
                        total_pages={local.pagination.total_pages}
                        items_per_page={local.pagination.items_per_page}
                        url={{
                          prefix: `/shipment?status=${local.activeFilter}&page=`,
                          suffix: ``,
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex-col gap-4 w-full lg:w-1/3 hidden lg:flex">
              <div className="bg-white overflow-hidden px-4 py-6 lg:rounded-2xl lg:shadow-xl">
                <ShipmentHelpLinks />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainEsensiLayout>
  );
};