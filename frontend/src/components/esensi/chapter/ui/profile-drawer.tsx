import { Button } from "@/components/ui/button";
import { CircleStop } from "lucide-react";
import { useLocal } from "@/lib/hooks/use-local";
import { Link, navigate } from "@/lib/router";
import { betterAuth } from "@/lib/better-auth";
import { toast } from "sonner";
import { rechargeCoinsModalState } from "@/lib/states/recharge-coins-modal-state";
import { RechargeCoinsModal } from "../recharge-coins-modal";
import { CustomRechargeModal } from "../custom-recharge-modal";
import { useState } from "react";

export const ProfileDrawer = ({
  open = false as boolean,
  user = null as any,
  action,
}) => {
  const [showCustomRecharge, setShowCustomRecharge] = useState(false);
  const local = useLocal(
    {
      loading: false as boolean,
      coins: 0 as number,
      loyalty_points: 0 as number,
    },
    async () => {
      if (user?.user?.email) {
        try {
          // Get customer coins from auth API or database
          const profileResponse = await fetch('/api/auth/profile', {
            credentials: 'include'
          });
          const profileData = await profileResponse.json();
          
          // Try to get coins from customer profile
          if (profileData.customer?.coins !== undefined) {
            local.coins = profileData.customer.coins;
          } else if (profileData.data?.loyality) {
            local.coins = profileData.data.loyality.points || 0;
            local.loyalty_points = profileData.data.loyality.points || 0;
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
          // Set default coins if API fails
          local.coins = 0;
        }
      }
      local.render();
    }
  );

  const handleLogout = async () => {
    try {
      local.loading = true;
      local.render();
      
      await betterAuth.signOut();
      toast.success("Berhasil keluar dari akun");
      navigate("/login");
    } catch (error) {
      toast.error("Terjadi kesalahan saat keluar");
      local.loading = false;
      local.render();
    }
  };

  const sectionProfile = user ? (
    <div className="flex items-center justify-start gap-4 w-full overflow-hidden">
      <div className="w-auto h-auto shrink-0">
        <img 
          src={user.user.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop`} 
          alt={user.user.fullname} 
          className="w-10 h-10 object-cover object-center overflow-hidden rounded-full" 
        />
      </div>
      <div className="w-auto grow-1 flex flex-col justify-around gap-0">
        <div className="text-sm font-medium">{user.user.fullname || `Pengguna`}</div>
        <div className="text-xs text-muted-foreground">{user.user.email || `user@esensichapter.com`}</div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center gap-4 w-full overflow-hidden">
      <div className="text-center">
        <div className="text-sm font-medium mb-2">Belum Login</div>
        <Button
          className="esensi-button text-xs"
          onClick={() => {
            navigate("/login");
          }}
        >
          Masuk
        </Button>
      </div>
    </div>
  );

  const sectionCoins = user ? (
    <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
      <div className="flex items-center gap-1.5 text-(--esensi-color) text-sm">
        <CircleStop strokeWidth={3} size={20} className="text-yellow-500" />
        <span className="text-md font-semibold -mr-0.5">{local.coins}</span> coins
      </div>
      <div className="flex gap-1">
        <Button 
          className="esensi-button text-xs uppercase h-7"
          onClick={() => {
            rechargeCoinsModalState.write.isOpen = true;
          }}
        >
          Top Up
        </Button>
        <Button 
          variant="outline"
          className="text-xs uppercase h-7 px-2"
          onClick={() => setShowCustomRecharge(true)}
        >
          Custom
        </Button>
      </div>
    </div>
  ) : null;

  const sectionMenu = user ? (
    <div className="flex flex-col gap-2 w-full">
      <Link 
        href="/library" 
        className="text-sm text-(--esensi-color) hover:text-(--esensi-color-alt) transition-colors py-2 px-3 rounded-lg hover:bg-white/50"
        onClick={action}
      >
        Koleksi Saya
      </Link>
      <Link 
        href="/profile" 
        className="text-sm text-(--esensi-color) hover:text-(--esensi-color-alt) transition-colors py-2 px-3 rounded-lg hover:bg-white/50"
        onClick={action}
      >
        Pengaturan Akun
      </Link>
      <Link 
        href="/penulis-pionir" 
        className="text-sm text-(--esensi-color) hover:text-(--esensi-color-alt) transition-colors py-2 px-3 rounded-lg hover:bg-white/50"
        onClick={action}
      >
        Menjadi Penulis
      </Link>
    </div>
  ) : null;

  const sectionSeparator = (
    <div className="w-full h-[1px] bg-[#8D93CE] my-4"></div>
  );

  const sectionLogout = user ? (
    <div className="mt-auto">
      <Button
        className="esensi-button w-full"
        onClick={handleLogout}
        disabled={local.loading}
      >
        {local.loading ? "Keluar..." : "Keluar"}
      </Button>
    </div>
  ) : null;

  return (
    <>
      <div
        className={`${
          open ? "flex" : "hidden"
        } w-full h-full fixed top-0 left-0 right-0 bottom-0 bg-black opacity-40 z-[59]`}
        onClick={action}
      ></div>
      <div
        className={`flex flex-col fixed gap-4 py-6 px-8 top-0 right-0 bottom-0 w-[300px] h-full bg-[#EAECFF] z-[60] transition-transform duration-300 ${
          open
            ? "translate-x-0 shadow-[-4px_0_30px_1px_rgba(0,0,0,0.15)]"
            : "translate-x-full"
        }`}
      >
        {sectionProfile}
        {sectionCoins && sectionSeparator}
        {sectionCoins}
        {sectionMenu && sectionSeparator}
        {sectionMenu}
        {sectionLogout && sectionSeparator}
        {sectionLogout}
      </div>
      
      {/* Modals */}
      <RechargeCoinsModal />
      <CustomRechargeModal 
        isOpen={showCustomRecharge}
        onClose={() => setShowCustomRecharge(false)}
      />
    </>
  );
};