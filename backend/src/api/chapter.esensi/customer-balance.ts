import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "customer_balance",
  url: "/api/chapter/customer-balance",
  async handler(arg: { id_user: string }) {
    const customer = await db.customer.findFirst({
      where: {
        auth_user: {
          id: arg.id_user
        }
      },
      select: {
        coins: true
      }
    });

    return {
      success: true,
      coins: customer?.coins || 0
    };
  },
});