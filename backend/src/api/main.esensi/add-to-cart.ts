import { defineAPI } from "rlib/server";

// Interface for the author data to be included
export type AuthorInfo = Partial<{
  id: string;
  name: string;
  author_address: { id_subdistrict: string | null }[];
}>;

// Add author to the CartItem interface
export type CartItem = Partial<{
  id: string;
  name: string;
  slug: string;
  cover: string | null;
  currency: string;
  real_price: number;
  strike_price: number;
  type: "bundle" | "product";
  bundleProducts: string[];
  weight?: number;
  is_physical?: boolean;
  author?: AuthorInfo | null;
  bundleDetails?: Partial<{
    id: string;
    name: string;
  }>[];
  quantity: number;
}>;

interface AddToCartResponse {
  success: boolean;
  error?: string;
  item?: CartItem;
  message?: string;
}

export default defineAPI({
  name: "add_to_cart",
  url: "/api/main/cart/add",
  async handler(arg: {
    id: string;
    type: "bundle" | "product";
  }): Promise<AddToCartResponse> {
    if (!arg.id || !arg.type) {
      return {
        success: false,
        error: "ID dan type harus diisi",
      };
    }

    let item: CartItem | null = null;

    if (arg.type === "product") {
      // **MODIFIED:** Include author and their primary address in the query
      const product = await db.product.findFirst({
        where: { id: arg.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              author_address: {
                where: { is_primary: true },
                select: {
                  id_subdistrict: true,
                },
                take: 1, // Ensure only one primary address is fetched
              },
            },
          },
        },
      });

      if (!product) {
        return { success: false, error: "Produk tidak ditemukan" };
      }

      // **REVISED:** Construct the final item object with the full author data.
      item = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        cover: product.cover,
        currency: product.currency,
        real_price: Number(product.real_price || 0),
        strike_price: Number(product.strike_price || 0),
        type: "product" as const,
        bundleProducts: [],
        is_physical: product.is_physical ?? false,
        weight: product.weight ?? 0,
        author: product.author, // Pass the entire author object
      };
    } else if (arg.type === "bundle") {
      // NOTE: Bundle logic remains the same.
      // You might need to decide how to handle author/shipping for bundles.
      const bundle = await db.bundle.findFirst({
        where: { id: arg.id },
        select: {
          id: true,
          name: true,
          slug: true,
          strike_price: true,
          cover: true,
          real_price: true,
          currency: true,
        },
      });

      if (bundle) {
        let bundleProducts = await db.bundle_product.findMany({
          where: { id_bundle: bundle.id },
          select: { id_product: true },
        });
        item = {
          id: bundle.id,
          name: bundle.name,
          slug: bundle.slug,
          cover: bundle.cover,
          currency: bundle.currency,
          real_price: Number(bundle.real_price || 0),
          strike_price: Number(bundle.strike_price || 0),
          type: "bundle" as const,
          bundleProducts: bundleProducts.map((p) => p.id_product),
          is_physical: false,
          author: null, // Bundles might not have a single author
        };
      }
    }

    if (!item) {
      return {
        success: false,
        error: "Item tidak ditemukan",
      };
    }

    return {
      success: true,
      item: item,
      message: `${item.name} berhasil ditambahkan ke keranjang`,
    };
  },
});
