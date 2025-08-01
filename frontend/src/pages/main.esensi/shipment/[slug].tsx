import { useEffect } from "react";
import { api } from "@/lib/gen/main.esensi"; // Your generated API client
import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { GlobalLoading } from "@/components/esensi/ui/global-loading";
import { ImgThumb } from "@/components/esensi/ui/img-thumb";
import { formatMoney } from "@/components/esensi/utils/format-money";
import { ShipmentHelpLinks } from "@/components/esensi/shipment/shipment-help-links"; // Updated Import
import { useRouter } from "@/lib/hooks/use-router";
import { useLocal } from "@/lib/hooks/use-local";
import StepperShipment from "@/components/esensi/shipment/shipment-stepper";
import type { WaybillResult } from "@/lib/rajaongkir";

// --- Type definitions ---
type ShipmentDetailsData = {
  transaction_id: string;
  store_name: string;
  date: string;
  customer_name: string;
  status: string;
  items: Array<{
    thumbnail: string;
    name: string;
    total_price: number;
    currency: string;
  }>;
  shipping_details: {
    courier: string;
    tracking_number: string; // This is the AWB
    address: string;
  };
};

export default () => {
  const router = useRouter();
  const { slug: shipmentId } = router.params;

  const local = useLocal({
    loading: true,
    shipmentData: null as ShipmentDetailsData | null,
    waybillData: null as WaybillResult | null,
    breadcrumb: [
      { label: "Pengiriman", url: "/shipment" },
    ],
  });

  useEffect(() => {
    if (typeof shipmentId !== "string") {
      if (local.loading) {
        local.loading = false;
        local.render();
      }
      return;
    }

    local.breadcrumb = [
      { label: "Pengiriman", url: "/shipment" },
      { label: `${shipmentId}...`,url: '' },
    ];
    // 3. Trigger a re-render immediately to display the full breadcrumb

    local.render();


    const fetchAllDetails = async () => {
      try {
        const shipmentResponse = await api.shipment({ query: { id: shipmentId } });
        const apiData = shipmentResponse.data;

        let currentShipmentData: ShipmentDetailsData | null = null;

        if (apiData && "shipment" in apiData && apiData.shipment) {
          currentShipmentData = {
            transaction_id: apiData.orderId,
            store_name: apiData.seller.name || "Toko Penjual",
            date: new Date(
              apiData.shipment.shippedAt || Date.now()
            ).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            customer_name: apiData.buyer?.name || "Pembeli",
            status: apiData.shipment.status,
            items: apiData.items.map((item: any) => ({
              thumbnail: item.cover,
              name: item.name,
              total_price: item.price,
              currency: item.currency,
            })),
            shipping_details: {
              courier: apiData.shipment.courier,
              tracking_number: apiData.shipment.awb,
              address: apiData.shipment.address,
            },
          };
          local.shipmentData = currentShipmentData;
        } else {
            local.shipmentData = null;
        }

        // Only fetch tracking details if an AWB exists
        if (currentShipmentData?.shipping_details.tracking_number && currentShipmentData?.shipping_details.courier) {
            const payload = {
                awb: currentShipmentData.shipping_details.tracking_number,
                courier: currentShipmentData.shipping_details.courier,
            };
            
            try {
                const trackingResponse = await api.tracking_shipment(payload);
                if (trackingResponse.success && trackingResponse.data?.data) {
                    local.waybillData = trackingResponse.data.data as WaybillResult;
                } else {
                    console.error("Backend reported an error:", trackingResponse.message);
                    local.waybillData = null;
                }
            } catch (trackingError) {
                console.error("Failed to fetch tracking details:", trackingError);
                local.waybillData = null;
            }
        } else {
            // If there's no AWB, ensure waybillData is null
            local.waybillData = null;
        }

      } catch (error) {
        console.error("Failed to fetch shipment details:", error);
        local.shipmentData = null;
        local.waybillData = null;
      } finally {
        local.loading = false;
        local.render();
      }
    };

    fetchAllDetails();
  }, [shipmentId]);
  
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Rincian Pengiriman",
    cart: true,
    profile: true,
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: "Menunggu Konfirmasi",
      unpaid: "Menunggu Pembayaran",
      waiting: "Siap Dikirim",
      shipping: "Dalam Pengiriman",
      delivered: "Telah Diterima",
      canceled: "Dibatalkan",
    };
    return labels[status] || "Status Tidak Dikenal";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-emerald-500 text-white shadow-lg";
      case "shipping": return "bg-blue-500 text-white shadow-lg";
      case "waiting": return "bg-purple-500 text-white shadow-lg";
      case "pending": return "bg-amber-500 text-white shadow-lg";
      case "unpaid":
      case "canceled": return "bg-red-500 text-white shadow-lg";
      default: return "bg-gray-200 text-gray-800 shadow-sm";
    }
  };
  
  const getStatusMessage = (status: string): string => {
    const messages: Record<string, string> = {
        pending: "Pesanan Anda sedang menunggu konfirmasi dari penjual. Kami akan memberitahu Anda jika sudah diproses.",
        unpaid: "Segera selesaikan pembayaran agar pesanan Anda dapat diproses oleh penjual.",
        waiting: "Pesanan telah dikemas dan siap untuk diserahkan kepada kurir. Menunggu penjemputan.",
        shipping: "Paket sedang dalam perjalanan menuju alamat Anda. Gunakan nomor resi untuk melacak posisi terakhir.",
        delivered: "Paket telah berhasil diterima di alamat tujuan. Terima kasih telah berbelanja!",
        canceled: "Pesanan ini telah dibatalkan. Hubungi kami jika Anda merasa ini adalah sebuah kesalahan."
    };
    return messages[status] || "Status pesanan tidak diketahui. Silakan hubungi pusat bantuan untuk informasi lebih lanjut.";
  };

  const renderLoading = <GlobalLoading />;

  const renderShipmentEmpty = (
    <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-8 text-center border border-gray-100">
      <h2 className="text-2xl font-bold text-[#3B2C93] mb-4">
        Pengiriman Tidak Ditemukan
      </h2>
      <p className="text-gray-600 mb-6">
        Data pengiriman yang Anda cari tidak ada atau Anda tidak memiliki akses.
      </p>
      <a
        href="/shipment"
        className="bg-[#3B2C93] text-white px-6 py-3 rounded-xl hover:bg-[#2D1F70] transition-all shadow-lg"
      >
        Kembali ke Daftar Pengiriman
      </a>
    </div>
  );

  const renderShipmentDetails = (
    <div className="bg-white lg:rounded-2xl lg:shadow-xl overflow-hidden border-0 lg:border border-gray-100">
      {/* Header */}
      <div className="bg-[#3B2C93] text-white p-4 sm:p-6 lg:p-8 text-center">
         <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
           <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
           </svg>
         </div>
         <h1 className="text-2xl font-bold">Rincian Pengiriman</h1>
         <p className="text-white/80 text-sm">
           {local.shipmentData?.store_name || "Status Pengiriman Digital"}
         </p>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Status Card */}
        <div className="bg-slate-50 rounded-xl p-4 sm:p-6 mb-8 border border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Status Pengiriman
            </h2>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(local.shipmentData?.status || "")}`}>
              {getStatusLabel(local.shipmentData?.status || "")}
            </div>
          </div>
          {/* Dynamic Status Message */}
          <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-slate-200">
              {getStatusMessage(local.shipmentData?.status || "")}
          </p>
          <div className="space-y-3 text-sm mt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">No. Pesanan:</span>
              <span className="font-semibold text-gray-900 break-all text-right pl-4">
                {local.shipmentData?.transaction_id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tanggal Kirim:</span>
              <span className="font-medium text-gray-900">
                {local.shipmentData?.date}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pelanggan:</span>
              <span className="font-medium text-gray-900">
                {local.shipmentData?.customer_name}
              </span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-8">
          <h3 className="text-xl font-bold text-[#3B2C93] mb-6">
            Barang yang Dikirim
          </h3>
          <div>
            {local.shipmentData?.items.map((item, index) => (
              <div key={index} className="flex gap-4 items-center py-2 [&:not(:last-child)]:border-b border-slate-200">
                <div className="flex-shrink-0 w-20 h-auto rounded-xl overflow-hidden border border-gray-200">
                  <ImgThumb src={item.thumbnail} alt={item.name} width={150} className="w-full h-auto aspect-3/4 object-cover" />
                </div>
                <h4 className="flex-1 font-semibold text-base text-gray-900 break-words">
                  {item.name}
                </h4>
                <div className="font-bold text-md text-[#3B2C93]">
                  {formatMoney(item.total_price, item.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Info */}
        {local.shipmentData?.shipping_details && (
          <div className="bg-blue-50 rounded-xl p-4 sm:p-6 mb-8 border border-blue-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Informasi Pengiriman
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Jasa Pengiriman:</span>
                <span className="font-medium text-gray-900 uppercase">
                  {local.shipmentData.shipping_details.courier}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nomor Resi:</span>
                <span className="font-medium text-blue-600 break-all text-right pl-4">
                  {local.shipmentData.shipping_details.tracking_number || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alamat:</span>
                <span className="font-medium text-gray-900 text-right pl-4">
                  {local.shipmentData.shipping_details.address}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Information Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-xl font-bold text-[#3B2C93] mb-6">
                Lacak Pengiriman
            </h3>
            <StepperShipment data={local.waybillData} />
        </div>
      </div>
    </div>
  );

  const renderContent = local.loading
    ? renderLoading
    : local.shipmentData
    ? renderShipmentDetails
    : renderShipmentEmpty;

  return (
    <MainEsensiLayout header_config={header_config}>
      <div className="flex flex-col justify-center items-start bg-[#E1E5EF] lg:items-center lg:py-10">
        <div className="flex flex-col w-full max-w-[1200px] gap-6 mx-auto">
          <div className="hidden lg:flex w-full justify-start px-4 lg:px-0">
            <Breadcrumbs data={local.breadcrumb} />
          </div>
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-6">
            <div className="flex flex-col gap-4 w-full lg:w-2/3">
              {renderContent}
            </div>
            <div className="flex flex-col gap-4 w-full lg:w-1/3 px-4 lg:px-0">
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