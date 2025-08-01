import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";
import { auth } from "backend/lib/better-auth"; // ADDED: For user authentication
import type { customer_address } from "shared/models"; // ADDED: For type safety

interface CartResponse {
  jsx: ReactElement;
  data: {
    title: string;
    addresses: customer_address[];
    defaultAddress: customer_address | null;
    user: any;
  };
}

export default defineAPI({
  name: "cart",
  url: "/cart",
  async handler(): Promise<CartResponse> {
    const req = this.req!;

    // --- 1. GET CURRENT USER ---
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    let addresses: customer_address[] = [];
    let defaultAddress: customer_address | null = null;
    
    // --- 2. FETCH ADDRESSES FROM DATABASE ---
    // If a user is logged in, fetch their addresses
    if (user?.idCustomer) {
      addresses = await db.customer_address.findMany({
        where: {
          id_customer: user.idCustomer,
        },
        orderBy: {
          is_primary: 'desc', // Puts the primary address first
        },
      });
      
      // Determine the default address to show
      defaultAddress = addresses.find(addr => addr.is_primary) || addresses[0] || null;
    }

    // --- 3. CONSTRUCT DYNAMIC DATA ---
    // This data object now matches what the frontend component expects
    const data = {
      title: "Keranjang Belanja",
      addresses: addresses, 
      defaultAddress: defaultAddress, 
      user: user,
    };
    
    const seo_data = {
      slug: `/cart`,
      meta_title: `Keranjang Belanja | Cek & Lanjutkan Pembelian`,
      meta_description: `Lihat item yang telah Anda pilih di keranjang belanja. Lanjutkan ke pembayaran dan dapatkan segera akses download dan baca ebook.`,
      image: ``,
      headings: `Keranjang Belanja Anda`,
      paragraph: `Lihat item yang telah Anda pilih di keranjang belanja. Lanjutkan ke pembayaran dan dapatkan segera akses download dan baca ebook.`,
      is_product: false,
    };

    return {
      jsx: (
        <>
          <SeoTemplate data={seo_data} />
        </>
      ),
      data: data,
    };
  },
});