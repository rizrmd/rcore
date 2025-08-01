import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "add_coins_temp",
  url: "/api/chapter/add-coins-temp",
  async handler(arg: { customerId: string; coins: number; type?: string }) {
    try {
      const { customerId, coins, type = "purchase" } = arg;

      if (!customerId || !coins || coins <= 0) {
        return {
          success: false,
          message: "Customer ID dan jumlah coins harus valid"
        };
      }

      // Check if customer exists
      const customer = await db.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        return {
          success: false,
          message: "Customer tidak ditemukan"
        };
      }

      // Add coins to customer
      const updatedCustomer = await db.customer.update({
        where: { id: customerId },
        data: {
          coins: customer.coins + coins
        }
      });

      // Log the transaction
      await db.coins_logs.create({
        data: {
          id_customer: customerId,
          type: `temp_${type}`,
          coins: coins,
          notes: `Temporary ${type} - added ${coins} coins`
        }
      });

      return {
        success: true,
        message: `Berhasil menambahkan ${coins} coins`,
        data: {
          previousCoins: customer.coins,
          newCoins: updatedCustomer.coins,
          addedCoins: coins
        }
      };
    } catch (error) {
      console.error("Error adding coins:", error);
      return {
        success: false,
        message: "Gagal menambahkan coins"
      };
    }
  },
});