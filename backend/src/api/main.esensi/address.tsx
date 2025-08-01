import { SeoTemplate } from "backend/components/SeoTemplate";
import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import type { customer_address } from "shared/models";

export default defineAPI({
  name: "address",
  url: "/address",
  async handler() {
    const req = this.req!;

    // Get current user session
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    let addresses: customer_address[] = [];
    let defaultAddress = null;
    
    // If user is logged in and has a customer profile, fetch their addresses
    if (user?.idCustomer) {
      addresses = await db.customer_address.findMany({
        where: {
          id_customer: user.idCustomer,
        },
        orderBy: {
          is_primary: 'desc', 
        },
      });
   
      defaultAddress = addresses.find(addr => addr.is_primary) || addresses[0] || null;
    }

    const data = {
      title: "Buku Alamat",
      addresses: addresses, 
      defaultAddress: defaultAddress, 
      user: user,
    };

    const seo_data = {
      slug: `/address`,
      meta_title: `Buku Alamat | Kelola Alamat Pengiriman Anda`,
      meta_description: `Kelola semua alamat pengiriman Anda di satu tempat. Tambah, edit, atau hapus alamat untuk memastikan proses pengiriman berjalan lancar.`,
      headings: `Buku Alamat Anda`,
      paragraph: `Pastikan proses pengiriman berjalan lancar dengan mengelola semua alamat Anda. Di halaman ini, Anda dapat menambah alamat baru, mengedit yang sudah ada, dan mengatur alamat utama.`,
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
