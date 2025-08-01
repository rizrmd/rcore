import { api } from "@/lib/gen/main.esensi";
import type { CartItem } from "shared/types";
import { proxy } from "valtio";

export type CartData = {
  items: CartItem[];
  currency: string;
  subtotal: number;
  diskon: number;
  diskon_persen: number;
  total: number;
  shippingCostsByAuthor: Record<string, number>;
  shippingOptionsByAuthor: Record<string, any[]>;
  selectedShippingByAuthor: Record<string, any | null>;
  shippingLoadingByAuthor: Record<string, boolean>;
  shippingErrorByAuthor: Record<string, string | null>;
  shippingCache: Record<string, any>;
};

export const cartState = {
  write: proxy<CartData>({
    items: [],
    currency: "Rp.",
    subtotal: 0,
    diskon: 0,
    diskon_persen: 0,
    total: 0,
    shippingCostsByAuthor: {},
    shippingOptionsByAuthor: {},
    selectedShippingByAuthor: {},
    shippingLoadingByAuthor: {},
    shippingErrorByAuthor: {},
    shippingCache: {},
  }),

  // Load cart from localStorage
  load() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("esensi-cart");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.write.items = data.items || [];
          this.calculate();
        } catch (error) {
          console.error("Error loading cart from localStorage:", error);
          this.reset();
        }
      }
    }
  },

  // Save cart to localStorage
  save() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "esensi-cart",
        JSON.stringify({
          items: this.write.items,
        })
      );
    }
  },

  // Add item to cart
  addItem(item: Omit<CartItem, "quantity">) {
    const existingItem = this.write.items.find(
      (cartItem) => cartItem.id === item.id && cartItem.type === item.type
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.write.items.push({ ...item, quantity: 1 });
    }

    this.calculate();
    this.save();
  },

  // Remove item from cart
  removeItem(id: string, type: "bundle" | "product") {
    this.write.items = this.write.items.filter(
      (item) => !(item.id === id && item.type === type)
    );
    this.calculate();
    this.save();
  },

  // Update item quantity
  updateQuantity(id: string, type: "bundle" | "product", quantity: number) {
    const item = this.write.items.find(
      (cartItem) => cartItem.id === id && cartItem.type === type
    );

    if (item) {
      if (quantity <= 0) {
        this.removeItem(id, type);
      } else {
        item.quantity = quantity;
        this.calculate();
        this.save();
      }
    }
  },

  // Clear all items
  clear() {
    this.write.items = [];
    this.calculate();
    this.save();
  },

  // Calculate totals
  calculate() {
    let subtotal = 0;
    let diskon = 0;

    for (const item of this.write.items) {
      const itemPrice = item.strike_price || item.real_price;
      const itemRealPrice = item.real_price;

      subtotal += itemPrice * item.quantity;

      if (item.strike_price && item.strike_price > item.real_price) {
        diskon += (item.strike_price - item.real_price) * item.quantity;
      }
    }

    this.write.subtotal = subtotal;
    this.write.diskon = diskon;
    this.write.diskon_persen =
      subtotal > 0 ? Math.round((diskon / subtotal) * 100) : 0;
    this.write.total = subtotal - diskon;
  },

  // Get item count
  getItemCount() {
    return this.write.items.reduce((total, item) => total + item.quantity, 0);
  },

  // Check if item exists in cart
  hasItem(id: string, type: "bundle" | "product") {
    return this.write.items.some(
      (item) => item.id === id && item.type === type
    );
  },

  // Reset cart to initial state
  reset() {
    this.write.items = [];
    this.write.currency = "Rp.";
    this.write.subtotal = 0;
    this.write.diskon = 0;
    this.write.diskon_persen = 0;
    this.write.total = 0;
    this.save();
  },

  clearShipping() {
    this.write.shippingCostsByAuthor = {};
    this.write.shippingOptionsByAuthor = {};
    this.write.selectedShippingByAuthor = {};
    this.write.shippingLoadingByAuthor = {};
    this.write.shippingErrorByAuthor = {};
  },

  setSelectedShipping(author: string, option: any) {
    this.write.selectedShippingByAuthor[author] = option;
    this.write.shippingCostsByAuthor[author] = option.cost;
    this.calculate();
  },

  async calculateShippingForGroup(
    author: string,
    originSubdistrictId: string,
    destinationSubdistrictId: string,
    weight: number
  ) {
    if (!originSubdistrictId || !destinationSubdistrictId || weight <= 0) {
      return;
    }

    const cacheKey = `${originSubdistrictId}-${destinationSubdistrictId}-${weight}`;

    if (this.write.shippingCache[cacheKey]) {
      const cachedData = this.write.shippingCache[cacheKey];
      this.write.shippingOptionsByAuthor[author] = cachedData.options;
      if (cachedData.options.length > 0) {
        const cheapestOption = cachedData.options[0];
        this.setSelectedShipping(author, cheapestOption);
      } else {
        this.write.shippingErrorByAuthor[author] = "Tidak ada opsi pengiriman.";
      }
      return;
    }

    this.write.shippingLoadingByAuthor[author] = true;
    this.write.shippingErrorByAuthor[author] = null;

    try {
      const res = await api.calculate_shipping_cost({
        origin: originSubdistrictId,
        destination: destinationSubdistrictId,
        weight: weight,
      });

      if (res.success && res.data && res.data.options) {
        this.write.shippingOptionsByAuthor[author] = res.data.options;
        this.write.shippingCache[cacheKey] = res.data;

        if (res.data.options.length > 0) {
          const cheapestOption = res.data.options[0];
          this.setSelectedShipping(author, cheapestOption);
        } else {
          this.write.shippingErrorByAuthor[author] =
            "Tidak ada opsi pengiriman.";
        }
      } else {
        this.write.shippingErrorByAuthor[author] =
          res.message || "Gagal mengambil data pengiriman.";
      }
    } catch (e: any) {
      console.error(`Error calculating shipping for ${author}:`, e);
      this.write.shippingErrorByAuthor[author] =
        e.message || "Terjadi kesalahan.";
    } finally {
      this.write.shippingLoadingByAuthor[author] = false;
    }
  },
};
