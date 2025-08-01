import { useSnapshot } from "valtio";
import { rechargeCoinsModalState } from "@/lib/states/recharge-coins-modal-state";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi";

export function RechargeCoinsModal() {
  const read = useSnapshot(rechargeCoinsModalState.write);
  
  const local = useLocal({
    packages: [] as Array<{ 
      id: number; 
      coins: number; 
      price: number; 
      bonus: number;
      discountPercentage?: number;
    }>,
    loading: false,
    error: null as string | null,
    basePrice: 0
  }, async () => {
    // Load coin packages from API
    local.loading = true;
    local.render();
    
    try {
      const response = await api.coin_packages();
      if (response?.success && response.data) {
        local.packages = response.data.packages;
        local.basePrice = response.data.basePrice;
      } else {
        local.error = "Gagal memuat paket koin";
      }
    } catch (error) {
      console.error("Failed to load coin packages:", error);
      local.error = "Gagal memuat paket koin";
      // Use default packages if API fails
      local.packages = [
        { id: 1, coins: 100, price: 10000, bonus: 0 },
        { id: 2, coins: 500, price: 45000, bonus: 50 },
        { id: 3, coins: 1000, price: 85000, bonus: 150 },
        { id: 4, coins: 2000, price: 160000, bonus: 400 },
        { id: 5, coins: 5000, price: 375000, bonus: 1250 },
        { id: 6, coins: 10000, price: 700000, bonus: 3000 },
      ];
    } finally {
      local.loading = false;
      local.render();
    }
  });

  const handleClose = () => {
    rechargeCoinsModalState.write.isOpen = false;
    rechargeCoinsModalState.write.selectedPackage = null;
  };

  const handlePurchase = async () => {
    if (!read.selectedPackage) return;
    
    local.loading = true;
    local.error = null;
    local.render();
    
    try {
      const response = await api.buy_coins_temp({ packageId: read.selectedPackage.id });
      
      if (response?.success) {
        alert(`${response.message}\nKoin sebelumnya: ${response.data.customer.previousCoins}\nKoin baru: ${response.data.customer.newCoins}`);
        handleClose();
        
        // Trigger page refresh to update coin balance in UI
        window.location.reload();
      } else {
        local.error = response?.message || "Gagal membeli koin";
      }
    } catch (error) {
      console.error("Failed to purchase coins:", error);
      local.error = "Gagal membeli koin";
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!read.isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black opacity-50 z-[60]"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-xl font-semibold text-gray-900">Top Up Koin</h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {local.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Memuat paket koin...</div>
              </div>
            ) : local.error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-500">{local.error}</div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">Pilih paket koin:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {local.packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => (rechargeCoinsModalState.write.selectedPackage = pkg)}
                      className={`flex flex-col items-center justify-between p-4 rounded-lg border transition-all cursor-pointer h-[120px] ${
                        read.selectedPackage?.id === pkg.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-lg font-bold text-gray-900">
                            {pkg.coins.toLocaleString('id-ID')}
                          </span>
                          <span className="text-yellow-500 text-lg">🪙</span>
                        </div>
                        <div className="h-4">
                          {pkg.bonus > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              (+{pkg.bonus} bonus)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">
                        {formatRupiah(pkg.price)}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 font-medium"
              >
                Batal
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={!read.selectedPackage || local.loading}
                className="flex-1 h-11 bg-(--esensi-color) hover:bg-(--esensi-color) hover:opacity-90 font-medium text-white disabled:opacity-50"
              >
                {local.loading ? "MEMPROSES..." : "BELI KOIN"}
              </Button>
            </div>
            
            {/* Error Message */}
            {local.error && !local.loading && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-600">{local.error}</div>
              </div>
            )}
            
            {/* Selected Package Info */}
            {read.selectedPackage && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total koin:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">
                      {(read.selectedPackage.coins + (read.selectedPackage.bonus || 0)).toLocaleString('id-ID')}
                    </span>
                    <span className="text-yellow-500">🪙</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Harga:</span>
                  <span className="font-semibold text-gray-900">
                    {formatRupiah(read.selectedPackage.price)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}