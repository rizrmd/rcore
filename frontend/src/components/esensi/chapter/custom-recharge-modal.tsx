import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { api } from "@/lib/gen/chapter.esensi";

interface CustomRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomRechargeModal({ isOpen, onClose }: CustomRechargeModalProps) {
  const [coins, setCoins] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecharge = async () => {
    const coinsAmount = parseInt(coins);
    
    if (!coinsAmount || coinsAmount <= 0) {
      setError("Jumlah coins harus lebih dari 0");
      return;
    }

    if (coinsAmount > 10000) {
      setError("Maksimal 10.000 coins per transaksi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.recharge_coins_temp({ coins: coinsAmount });

      if (response?.success) {
        alert(`${response.message}\nKoin sebelumnya: ${response.data.customer.previousCoins}\nKoin baru: ${response.data.customer.newCoins}`);
        onClose();
        setCoins("");
        
        // Trigger page refresh to update coin balance in UI
        window.location.reload();
      } else {
        setError(response?.message || "Gagal mengisi ulang koin");
      }
    } catch (err) {
      console.error("Failed to recharge coins:", err);
      setError("Gagal mengisi ulang koin");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setCoins("");
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black opacity-50 z-[60]"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-xl font-semibold text-gray-900">Isi Ulang Koin Custom</h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Masukkan jumlah koin yang ingin ditambahkan:</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Koin
                </label>
                <Input
                  type="number"
                  value={coins}
                  onChange={(e) => setCoins(e.target.value)}
                  placeholder="Contoh: 1000"
                  min="1"
                  max="10000"
                  className="w-full"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Maksimal 10.000 koin per transaksi</p>
              </div>

              {/* Quick amount buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCoins(amount.toString())}
                    disabled={loading}
                    className="p-2 text-sm border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {amount.toLocaleString('id-ID')} 🪙
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 font-medium"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handleRecharge}
                disabled={!coins || loading}
                className="flex-1 h-11 bg-(--esensi-color) hover:bg-(--esensi-color) hover:opacity-90 font-medium text-white disabled:opacity-50"
              >
                {loading ? "MEMPROSES..." : "ISI ULANG"}
              </Button>
            </div>
            
            {/* Error Message */}
            {error && !loading && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}