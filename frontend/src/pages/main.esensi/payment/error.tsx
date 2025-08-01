import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { Button } from "@/components/ui/button";
import { useLocal } from "@/lib/hooks/use-local";
import { Link } from "@/lib/router";
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

export default () => {
  const header_config = {
    enable: true,
    logo: true,
    back: false,
    search: false,
    title: "Pembayaran Gagal",
    cart: true,
    profile: true,
  };

  const local = useLocal(
    {
      order_id: "",
      loading: true,
      order_data: null as any,
      error_reason: "",
    },
    async () => {
      // Get order ID and error info from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      local.order_id =
        urlParams.get("order_id") || urlParams.get("transaction_id") || "";
      local.error_reason =
        urlParams.get("error") || "Pembayaran tidak dapat diproses";

      if (local.order_id) {
        try {
          // Note: Implement this API call when the backend API is ready
          // const response = await api.check_order_status({
          //   order_id: local.order_id,
          // });

          // Mock data for demo
          local.order_data = {
            order_id: local.order_id,
            status: "failed",
            total_amount: 150000,
            currency: "Rp.",
          };
        } catch (error) {
          console.error("Error fetching order details:", error);
        }
      }

      local.loading = false;
      local.render();
    }
  );

  const getErrorMessage = () => {
    const commonErrors = {
      insufficient_funds: "Saldo tidak mencukupi",
      card_declined: "Kartu ditolak oleh bank",
      expired_card: "Kartu sudah expired",
      invalid_card: "Nomor kartu tidak valid",
      network_error: "Koneksi terputus",
      timeout: "Waktu pembayaran habis",
      fraud_detected: "Transaksi mencurigakan terdeteksi",
      limit_exceeded: "Batas transaksi terlampaui",
    };

    return (
      commonErrors[local.error_reason as keyof typeof commonErrors] ||
      local.error_reason ||
      "Terjadi kesalahan saat memproses pembayaran"
    );
  };

  const getSolutions = () => {
    const solutions = [
      "Pastikan informasi kartu/rekening Anda benar",
      "Periksa saldo atau limit transaksi Anda",
      "Coba gunakan metode pembayaran yang berbeda",
      "Hubungi bank Anda jika masalah berlanjut",
      "Pastikan koneksi internet Anda stabil",
    ];

    return solutions;
  };

  const retryPayment = () => {
    // Redirect back to checkout or cart
    window.location.href = "/cart";
  };

  const renderContent = () => {
    if (local.loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B2C93]"></div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#3B2C93]">
            Pembayaran Gagal
          </h1>
          <p className="text-gray-600 text-lg">
            Maaf, pembayaran Anda tidak dapat diproses.
          </p>
          <p className="text-red-600 font-medium">{getErrorMessage()}</p>
        </div>

        {/* Order Details */}
        {local.order_data && (
          <div className="w-full max-w-md bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-[#3B2C93] text-lg">
              Detail Pesanan
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Pesanan:</span>
                <span className="font-medium">{local.order_data.order_id}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Total Pembayaran:</span>
                <span className="font-medium">
                  {local.order_data.currency}{" "}
                  {local.order_data.total_amount.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-red-600">Gagal</span>
              </div>
            </div>
          </div>
        )}

        {/* Solutions */}
        <div className="w-full max-w-md bg-yellow-50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-[#3B2C93] text-lg">
            Solusi yang Bisa Dicoba:
          </h3>

          <ul className="text-left text-sm space-y-2">
            {getSolutions().map((solution, index) => (
              <li key={index} className="flex items-start">
                <span className="text-[#3B2C93] mr-2">•</span>
                <span className="text-gray-700">{solution}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button
            onClick={retryPayment}
            className="flex-1 bg-[#3B2C93] hover:bg-[#2A1F6A] text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>

          <Link href="/cart" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-[#3B2C93] text-[#3B2C93] hover:bg-[#3B2C93] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Keranjang
            </Button>
          </Link>
        </div>

        {/* Alternative Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link href="/bundles" className="flex-1">
            <Button
              variant="ghost"
              className="w-full text-[#3B2C93] hover:bg-[#3B2C93] hover:text-white"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Belanja Lagi
            </Button>
          </Link>

          <Link href="/history/failed/1" className="flex-1">
            <Button
              variant="ghost"
              className="w-full text-[#3B2C93] hover:bg-[#3B2C93] hover:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Riwayat Pesanan
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>Pesanan Anda tidak akan diproses karena pembayaran gagal</p>
          <p>Anda dapat mencoba lagi dengan metode pembayaran yang berbeda</p>
        </div>

        {/* Help Link */}
        <div className="text-center">
          <Link
            href="/how-to-buy"
            className="text-[#3B2C93] hover:underline text-sm"
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Butuh bantuan? Lihat panduan pembayaran di sini
          </Link>
        </div>

        {/* Contact Support */}
        <div className="w-full max-w-md bg-blue-50 rounded-lg p-4 text-center">
          <h4 className="font-medium text-[#3B2C93] mb-2">
            Masih Mengalami Masalah?
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Tim support kami siap membantu Anda
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="mailto:support@esensi.online"
              className="flex-1 text-sm text-[#3B2C93] hover:underline"
            >
              📧 support@esensi.online
            </a>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-[#3B2C93] hover:underline"
            >
              📱 WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={true}>
      <div className="flex flex-col justify-start items-center w-full min-h-screen">
        <div className="flex flex-col w-full py-12 px-6 max-w-[800px]">
          {renderContent()}
        </div>
      </div>
    </MainEsensiLayout>
  );
};
