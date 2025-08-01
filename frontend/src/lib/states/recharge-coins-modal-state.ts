import { proxy } from "valtio";

interface CoinPackage {
  id: number;
  coins: number;
  price: number;
  bonus?: number;
}

export const rechargeCoinsModalState = {
  write: proxy({
    isOpen: false,
    selectedPackage: null as CoinPackage | null,
  }),
  reset() {
    this.write.isOpen = false;
    this.write.selectedPackage = null;
  },
};