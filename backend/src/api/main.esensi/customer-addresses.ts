  import { auth } from "backend/lib/better-auth";
  import { defineAPI } from "rlib/server";

  export default defineAPI({
    name: "customer_addresses",
    url: "/api/customer_addresses",
  async handler() {
      const req = this.req!;
      const session = await auth.api.getSession({ headers: req.headers });
      const user = session?.user;


      if (!user?.idCustomer) {
        return [];
      }

      const addresses = await db.customer_address.findMany({
        where: {
          id_customer: user.idCustomer,
        },
        orderBy: {
          is_primary: 'desc', 
        },
      });

      return addresses;
    },
  });

