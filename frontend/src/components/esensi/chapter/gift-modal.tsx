import { useSnapshot } from "valtio";
import { giftModalState } from "@/lib/states/gift-modal-state";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi";
import { betterAuth } from "@/lib/better-auth";
import { rechargeCoinsModalState } from "@/lib/states/recharge-coins-modal-state";

export function GiftModal() {
  const read = useSnapshot(giftModalState.write);
  
  const local = useLocal({
    gifts: [] as Array<{ id: number; name: string; emoji: string; coins: number }>,
    loading: false,
    error: null as string | null,
    userCoins: 0
  }, async () => {
    // Load gift options from API
    local.loading = true;
    local.render();
    
    try {
      // Fetch gift options
      const response = await api.gift_options();
      if (response?.success && response.data) {
        local.gifts = response.data;
      } else {
        local.error = "Gagal memuat pilihan hadiah";
      }
      
      // Fetch user coin balance
      const session = await betterAuth.getSession();
      if (session.data?.user?.id) {
        try {
          const balanceResponse = await api.customer_balance({ id_user: session.data.user.id });
          if (balanceResponse?.success) {
            local.userCoins = balanceResponse.coins || 0;
          }
        } catch (e) {
          // If API is not available yet, set to 0
          local.userCoins = 0;
        }
      }
    } catch (error) {
      console.error("Failed to load gift options:", error);
      local.error = "Gagal memuat pilihan hadiah";
    } finally {
      local.loading = false;
      local.render();
    }
  });

  const handleClose = () => {
    giftModalState.write.isOpen = false;
    giftModalState.write.selectedGift = null;
  };

  const handleSendGift = () => {
    console.log("Sending gift:", read.selectedGift);
    handleClose();
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
            <h2 className="text-xl font-semibold text-gray-900">Kirim Hadiah</h2>
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
                <div className="text-sm text-gray-500">Memuat pilihan hadiah...</div>
              </div>
            ) : local.error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-500">{local.error}</div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">Pilih hadiah untuk author:</p>
                {read.selectedGift && local.userCoins < read.selectedGift.coins && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Saldo koin tidak mencukupi. Silakan top up terlebih dahulu.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {local.gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => (giftModalState.write.selectedGift = gift)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer ${
                    read.selectedGift?.id === gift.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-3xl mb-2">{gift.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 mb-1">
                    {gift.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-900">{gift.coins}</span>
                    <span className="text-yellow-500">🪙</span>
                  </div>
                </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex gap-3 px-6 pb-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 font-medium"
            >
              Batal
            </Button>
            <Button
              onClick={handleSendGift}
              disabled={!read.selectedGift || (read.selectedGift && local.userCoins < read.selectedGift.coins)}
              className="flex-1 h-11 bg-(--esensi-color) hover:bg-(--esensi-color) hover:opacity-90 font-medium text-white disabled:opacity-50"
            >
              KIRIM HADIAH
            </Button>
          </div>
          
          {/* Balance */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 pb-6">
            <span>Sisa saldo:</span>
            <span className="font-semibold">{local.userCoins}</span>
            <span className="text-yellow-500">🪙</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-2 h-6 px-2 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300"
              onClick={() => {
                handleClose();
                rechargeCoinsModalState.write.isOpen = true;
              }}
            >
              Top Up
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}