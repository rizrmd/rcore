import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { formatMoney } from "@/components/esensi/utils/format-money";
import { GlobalLoading } from "@/components/esensi/ui/global-loading";
import { ImgThumb } from "@/components/esensi/ui/img-thumb";
import { MainEsensiLayout, current } from "@/components/esensi/layout/layout";
import { TrxHelpLinks } from "@/components/esensi/transaction/trx-help-links";
import { api } from "@/lib/gen/main.esensi";

export default (data: Awaited<ReturnType<typeof api.trx>>["data"]) => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Rincian Pembelian",
    cart: false,
    profile: false,
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500 text-white shadow-lg";
      case "pending":
        return "bg-amber-500 text-white shadow-lg";
      case "canceled":
        return "bg-red-500 text-white shadow-lg";
      case "expired":
        return "bg-gray-500 text-white shadow-lg";
      case "fraud":
      case "failed":
        return "bg-red-600 text-white shadow-lg";
      default:
        return "bg-gray-200 text-gray-800 shadow-sm";
    }
  };

  // Helper function to get status label in Indonesian
  function getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      pending: "Menunggu Pembayaran",
      paid: "Berhasil",
      failed: "Gagal",
      expired: "Kadaluwarsa",
      canceled: "Dibatalkan",
      fraud: "Ditolak",
      refunded: "Dikembalikan",
    };
    return statusLabels[status] || status;
  }

  // Helper function to get payment method label in Indonesian
  function getPaymentMethod(method: string): string {
    const statusLabels: Record<string, string> = {
      credit_card: "Kartu Kredit",
      echannel: "E-Channel",
      virtual_account: "Virtual Account",
      gopay: "Gopay",
      ovo: "OVO",
      shopeepay: "ShopeePay",
      dana: "DANA",
      linkaja: "LinkAja",
      alfamart: "Alfamart",
      indomaret: "Indomaret",
      minimarket: "Minimarket",
      pulsa: "Pulsa",
      qr_code: "QR Code",
      direct_debit: "Debit Langsung",
      cash: "Tunai",
      bank_transfer: "Transfer Bank",
      e_wallet: "Dompet Digital",
      cash_on_delivery: "Bayar di Tempat",
      other: "Lainnya",
      unknown: "Tidak Diketahui",
    };
    return statusLabels[method] || method;
  }

  const local = {
    loading: true as boolean,
    error: null as string | null,
    title: "Detail transaksi" as string,
    trx: null as any,
    receiptData: null as any,
    breadcrumb: [] as any[],
  };

  if (data) {
    local.receiptData = data.receiptData;
    local.breadcrumb = data.breadcrumb;
    local.title = data.title;
    local.loading = false;
  }
  console.log(local.receiptData?.payment_details);
  // Render by the conditions
  const renderLoading = <GlobalLoading />;

  const renderLoggedOut = !local.loading && (
    <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-gray-100">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-[#3B2C93] mb-3 sm:mb-4">
        {local.title}
      </h2>
      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
        Silakan login terlebih dahulu untuk melihat detail transaksi.
      </p>
      <button className="bg-[#3B2C93] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-[#2D1F70] transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base">
        Login Sekarang
      </button>
    </div>
  );

  const renderReceiptEmpty = !local.loading && (
    <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-gray-100">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-[#3B2C93] mb-3 sm:mb-4">
        Transaksi Tidak Ditemukan
      </h2>
      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
        Data transaksi yang Anda cari tidak ditemukan atau mungkin sudah
        dihapus.
      </p>
      <button className="bg-[#3B2C93] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-[#2D1F70] transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base">
        Kembali ke Beranda
      </button>
    </div>
  );

  const renderReceiptFound = !local.loading && (
    <div className="bg-white lg:rounded-2xl lg:shadow-xl overflow-hidden border-0 lg:border border-gray-100">
      {/* Receipt Header */}
      <div className="bg-[#3B2C93] text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">
            {local.receiptData?.store_name || "Detail Transaksi"}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm">
            {local.receiptData?.store_address || "Struk Digital"}
          </p>
        </div>
      </div>

      {/* Receipt Body */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Transaction Status Card */}
        <div className="bg-slate-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              Status Transaksi
            </h2>
            <div
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm self-start ${getStatusBadgeColor(
                local.receiptData?.status
              )}`}
            >
              {getStatusLabel(local.receiptData?.status)}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 text-xs sm:text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#3B2C93] rounded-full flex-shrink-0"></div>
                <span className="text-gray-600 min-w-0">No. Transaksi:</span>
                <span className="font-semibold text-gray-900 ml-auto text-right break-all">
                  {local.receiptData?.transaction_id}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#3B2C93] rounded-full flex-shrink-0"></div>
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-medium text-gray-900 ml-auto">
                  {local.receiptData?.date}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#3B2C93] rounded-full flex-shrink-0"></div>
                <span className="text-gray-600">Waktu:</span>
                <span className="font-medium text-gray-900 ml-auto">
                  {local.receiptData?.time}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#3B2C93] rounded-full flex-shrink-0"></div>
                <span className="text-gray-600">Pelanggan:</span>
                <span className="font-medium text-gray-900 ml-auto text-right">
                  {local.receiptData?.customer_name}
                </span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#3B2C93] rounded-full flex-shrink-0 mt-1"></div>
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900 ml-auto text-right text-xs break-all">
                  {local.receiptData?.customer_email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 sm:px-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#3B2C93] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#3B2C93]">
              Rincian Pembelian
            </h3>
          </div>
          <div className="">
            {local.receiptData?.items.map((item, index) => (
              <div
                key={index}
                className="flex gap-3 items-center sm:gap-4 py-2 sm:px-4 [&:not(:last-child)]:border-b border-slate-200"
              >
                {/* Product/Bundle Thumbnail */}
                <div className="flex-shrink-0">
                  <div className="w-16 sm:w-20 h-auto rounded-xl overflow-hidden bg-white border border-gray-200">
                    <ImgThumb
                      src={item.thumbnail}
                      alt={item.name}
                      width={150}
                      className="w-full h-auto aspect-3/4 object-cover"
                    />
                  </div>
                </div>

                {/* Product/Bundle Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-3 ">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                      <div className="flex flex-col justify-start gap-2 sm:gap-3 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base leading-tight text-gray-900 break-words">
                          {item.name}
                        </h4>

                        {item.type === "bundle" && (
                          <div className="flex justify-start">
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium shadow-sm border border-indigo-200">
                              {item.type === "product" ? "Produk" : "Bundle"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col shrink-0 text-right justify-end items-end gap-1 sm:gap-2">
                        {item.strike_price !== null &&
                          item.strike_price > 0 && (
                            <div className="text-right line-through text-xs sm:text-sm text-gray-500 bg-red-50 px-2 py-1 rounded">
                              {formatMoney(item.strike_price, item.currency)}
                            </div>
                          )}
                        <div className="text-right font-bold text-base sm:text-md text-[#3B2C93] bg-white px-2 sm:px-3 py-1 rounded-lg shadow-sm">
                          {formatMoney(item.total_price, item.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-indigo-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-indigo-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 sm:px-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#3B2C93] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              Ringkasan Pembayaran
            </h3>
          </div>
          <div className="space-y-2 sm:space-y-3 py-2 sm:px-4 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">
                {formatMoney(
                  local.receiptData?.subtotal,
                  local.receiptData?.currency
                )}
              </span>
            </div>
            {local.receiptData?.tax > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pajak:</span>
                <span className="font-medium text-gray-900">
                  {formatMoney(
                    local.receiptData.tax,
                    local.receiptData.currency
                  )}
                </span>
              </div>
            )}
            <div className="border-t border-indigo-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
              <div className="flex justify-between items-center py-3 px-3 sm:px-4 bg-[#3B2C93] text-white rounded-xl shadow-lg">
                <span className="text-base sm:text-lg font-bold">TOTAL:</span>
                <span className="text-lg sm:text-xl font-bold">
                  {formatMoney(
                    local.receiptData?.total,
                    local.receiptData?.currency
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {local.receiptData?.payment_details && (
          <div className="bg-emerald-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-emerald-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 sm:px-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Informasi Pembayaran
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="space-y-2 sm:space-y-3 sm:px-4">
                <div className="flex sm:items-center justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600">Metode Pembayaran:</span>
                  <span className="font-medium text-gray-900 text-right">
                    {getPaymentMethod(
                      local.receiptData?.payment_details?.data?.payment_type
                    ) || "Tidak Diketahui"}
                  </span>
                </div>
                {local.receiptData.payment_details.data?.gross_amount && (
                  <div className="flex sm:items-center justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Jumlah Bayar:</span>
                    <span className="font-medium text-gray-900 text-right">
                      {formatMoney(
                        local.receiptData.payment_details.data.gross_amount,
                        local.receiptData?.currency
                      )}
                    </span>
                  </div>
                )}
                {local.receiptData.payment_details.data?.timestamp && (
                  <div className="flex sm:items-center justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Waktu Transaksi:</span>
                    <span className="font-medium text-gray-900 text-right text-xs">
                      {new Date(
                        local.receiptData.payment_details.data.timestamp
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="flex sm:items-center justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600">Status Pembayaran:</span>
                  <span className="font-medium text-gray-900 text-right">
                    {local.receiptData.payment_details.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B2C93]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-[#3B2C93] font-semibold text-sm sm:text-base">
              Terima kasih atas pembelian Anda!
            </p>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">
            Simpan struk ini sebagai bukti pembelian yang valid
          </p>
        </div>
      </div>

      {/* Print Button 
      <div className="bg-slate-50 p-4 sm:p-6 border-t border-gray-200">
        <div className="flex justify-center">
          <button
            onClick={() => window.print()}
            className="cursor-pointer group flex items-center gap-2 sm:gap-3 bg-[#3B2C93] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-[#2D1F70] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Struk
          </button>
        </div>
      </div>
      */}
    </div>
  );

  const renderReceipt =
    local.receiptData !== null ? renderReceiptFound : renderReceiptEmpty;

  const renderContent = local.loading ? renderLoading : renderReceipt;

  return (
    <MainEsensiLayout header_config={header_config}>
      <div className="flex flex-col justify-center items-start bg-[#E1E5EF] lg:items-center lg:py-10">
        <div className="flex flex-col w-full max-w-[1200px] gap-6 mx-auto">
          <div className="hidden lg:flex w-full justify-start">
            <Breadcrumbs data={local.breadcrumb} />
          </div>
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-6">
            <div className="flex flex-col gap-4 w-full lg:w-auto lg:flex-1">
              {renderContent}
            </div>
            <div className="flex flex-col gap-4 w-full lg:w-1/3">
              <div className="bg-white overflow-hidden px-4 py-6 lg:rounded-lg lg:shadow-lg ">
                <TrxHelpLinks />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainEsensiLayout>
  );
};
