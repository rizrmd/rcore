import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { Button } from "@/components/ui/button";
import { useLocal } from "@/lib/hooks/use-local";
import { Link } from "@/lib/router";
import { CheckCircle, Download, FileText, ShoppingBag } from "lucide-react";

export default () => {
  const header_config = {
    enable: true,
    logo: true,
    back: false,
    search: false,
    title: "Pembayaran Berhasil",
    cart: true,
    profile: true,
  };

  const local = useLocal(
    {
      order_id: "",
      loading: true,
      order_data: null as any,
    },
    async () => {
      // Get order ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      local.order_id =
        urlParams.get("order_id") || urlParams.get("transaction_id") || "";

      if (local.order_id) {
        try {
          // Check order status to get details
          // Note: Implement this API call when the backend API is ready
          // const response = await api.check_order_status({
          //   order_id: local.order_id,
          // });
          // For now, we'll show success message without detailed order data
          // if (response.success) {
          //   local.order_data = response.data;
          // }
        } catch (error) {
          console.error("Error fetching order details:", error);
        }
      }

      local.loading = false;
      local.render();
    }
  );

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
        {/* Success Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#3B2C93]">
            Pembayaran Berhasil!
          </h1>
          <p className="text-gray-600 text-lg">
            Terima kasih! Pembayaran Anda telah berhasil diproses.
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
                <span className="font-medium text-green-600">Berhasil</span>
              </div>
            </div>

            {/* Purchased Items */}
            {local.order_data.items && local.order_data.items.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Item yang Dibeli:
                </h4>
                <div className="space-y-2">
                  {local.order_data.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} {item.quantity > 1 && `(${item.quantity}x)`}
                      </span>
                      <span className="font-medium">
                        {local.order_data.currency}{" "}
                        {(item.price * item.quantity).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link href="/library" className="flex-1">
            <Button className="w-full bg-[#3B2C93] hover:bg-[#2A1F6A] text-white">
              <Download className="w-4 h-4 mr-2" />
              Lihat Koleksi Saya
            </Button>
          </Link>

          <Link href="/bundles" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-[#3B2C93] text-[#3B2C93] hover:bg-[#3B2C93] hover:text-white"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Belanja Lagi
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>
            Anda dapat mengakses buku yang telah dibeli di halaman{" "}
            <strong>Koleksi Saya</strong>
          </p>
          <p>Email konfirmasi telah dikirim ke alamat email Anda</p>
        </div>

        {/* Help Link */}
        <div className="text-center">
          <Link
            href="/how-to-buy"
            className="text-[#3B2C93] hover:underline text-sm"
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Butuh bantuan? Lihat panduan di sini
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
