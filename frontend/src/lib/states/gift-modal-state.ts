import { proxy } from "valtio";

interface Gift {
  id: number;
  name: string;
  emoji: string;
  coins: number;
}

export const giftModalState = {
  write: proxy({
    isOpen: false,
    selectedGift: null as Gift | null,
  }),
  reset() {
    this.write.isOpen = false;
    this.write.selectedGift = null;
  },
};