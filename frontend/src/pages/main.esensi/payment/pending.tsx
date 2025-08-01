import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { Link } from "@/lib/router";
import { Clock, Copy, CreditCard, FileText, RefreshCw } from "lucide-react";

export default () => {
  const header_config = {
    enable: true,
    logo: true,
    back: false,
    search: false,
    title: "Menunggu Pembayaran",
    cart: true,
    profile: true,
  };

  const local = useLocal(
    {
      order_id: "",
      loading: true,
      order_data: null as any,
      copied: false,
    },
    async () => {
      // Get order ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      local.order_id =
        urlParams.get("order_id") || urlParams.get("transaction_id") || "";

      if (local.order_id) {
        try {
          const response = await api.check_payment_status({
            order_id: local.order_id,
          });

          if (response.success) {
            local.order_data = response.data;
          } else {
            console.error("Error fetching order details:", response.message);
          }
        } catch (error) {
          console.error("Error fetching order details:", error);
        }
      }

      local.loading = false;
      local.render();
    }
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    local.copied = true;
    local.render();

    setTimeout(() => {
      local.copied = false;
      local.render();
    }, 2000);
  };

  const refreshStatus = async () => {
    if (!local.order_id) return;

    local.loading = true;
    local.render();

    try {
      const response = await api.check_payment_status({
        order_id: local.order_id,
      });

      if (response.success) {
        local.order_data = response.data;

        // If payment is successful, redirect to success page
        if (response.data?.status === "success") {
          window.location.href = `/payment/success?order_id=${local.order_id}`;
          return;
        }
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
    }

    local.loading = false;
    local.render();
  };

  const getPaymentInstructions = () => {
    if (!local.order_data?.payment_info) return null;

    const paymentInfo = local.order_data.payment_info;
    const paymentType = paymentInfo.payment_type;
    const vaNumbers = paymentInfo.va_numbers;

    if (paymentType === "bank_transfer" && vaNumbers && vaNumbers.length > 0) {
      const va = vaNumbers[0];
      const bankName = va.bank.toUpperCase();

      return (
        <div className="w-full max-w-md bg-blue-50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-[#3B2C93] text-lg">
            Instruksi Pembayaran
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Virtual Account {bankName}:
              </p>
              <div className="flex items-center justify-between bg-white p-3 rounded border">
                <span className="font-mono text-lg font-bold">
                  {va.va_number}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(va.va_number)}
                  className="ml-2"
                >
                  <Copy className="w-4 h-4" />
                  {local.copied ? "Tersalin!" : "Salin"}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">
                Jumlah yang harus dibayar:
              </p>
              <div className="bg-white p-3 rounded border">
                <span className="font-bold text-lg">
                  {local.order_data.currency}{" "}
                  {local.order_data.total_amount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Lakukan transfer sesuai dengan nominal yang tertera</p>
            <p>• Pembayaran akan otomatis terkonfirmasi dalam 1-5 menit</p>
            <p>• Virtual Account akan otomatis expired dalam 24 jam</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-[#3B2C93] text-lg mb-2">
          Menunggu Pembayaran
        </h3>
        <p className="text-gray-600">
          Silakan selesaikan pembayaran Anda untuk melanjutkan proses pesanan.
        </p>
      </div>
    );
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
        {/* Pending Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full">
          <Clock className="w-12 h-12 text-yellow-600" />
        </div>

        {/* Pending Message */}
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#3B2C93]">
            Menunggu Pembayaran
          </h1>
          <p className="text-gray-600 text-lg">
            Pesanan Anda telah dibuat. Silakan selesaikan pembayaran.
          </p>
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
                <span className="font-medium text-yellow-600">
                  Menunggu Pembayaran
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Instructions */}
        {getPaymentInstructions()}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button
            onClick={refreshStatus}
            className="flex-1 bg-[#3B2C93] hover:bg-[#2A1F6A] text-white"
            disabled={local.loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${local.loading ? "animate-spin" : ""}`}
            />
            Refresh Status
          </Button>

          <Link href="/history/pending/1" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-[#3B2C93] text-[#3B2C93] hover:bg-[#3B2C93] hover:text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Riwayat Pesanan
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>
            Setelah pembayaran berhasil, Anda akan mendapat akses ke buku yang
            dibeli
          </p>
          <p>
            Jika pembayaran tidak selesai dalam 24 jam, pesanan akan dibatalkan
            otomatis
          </p>
        </div>

        {/* Help Link */}
        <div className="text-center">
          <Link
            href="/how-to-buy"
            className="text-[#3B2C93] hover:underline text-sm"
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Butuh bantuan pembayaran? Lihat panduan di sini
          </Link>
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
