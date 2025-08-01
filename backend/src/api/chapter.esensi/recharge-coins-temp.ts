import { defineAPI } from "rlib/server";
import { utils } from "../../lib/better-auth";

export default defineAPI({
  name: "recharge_coins_temp",
  url: "/api/chapter/recharge-coins-temp",
  async handler(arg: { coins: number }) {
    const req = this.req!;
    const sessionData = await utils.getSession(req.headers);
    
    // Check if user is logged in
    if (!sessionData?.user?.id) {
      return {
        success: false,
        message: "Anda harus login untuk mengisi ulang coins"
      };
    }
    
    try {
      if (!arg.coins || arg.coins <= 0) {
        return {
          success: false,
          message: "Jumlah coins harus lebih dari 0"
        };
      }

      if (arg.coins > 10000) {
        return {
          success: false,
          message: "Maksimal 10.000 coins per transaksi"
        };
      }

      // Find customer by auth_user id
      const customer = await db.customer.findFirst({
        where: {
          auth_user: {
            id: sessionData.user.id
          }
        },
        select: {
          id: true,
          coins: true,
          name: true
        }
      });
      
      if (!customer) {
        return {
          success: false,
          message: "Customer tidak ditemukan"
        };
      }

      // Add coins to customer
      const updatedCustomer = await db.customer.update({
        where: { id: customer.id },
        data: {
          coins: customer.coins + arg.coins
        }
      });

      // Log the transaction
      await db.coins_logs.create({
        data: {
          id_customer: customer.id,
          type: "temp_recharge",
          coins: arg.coins,
          notes: `Temporary recharge - added ${arg.coins} coins`
        }
      });

      return {
        success: true,
        message: `Berhasil mengisi ulang ${arg.coins} coins!`,
        data: {
          customer: {
            name: customer.name,
            previousCoins: customer.coins,
            newCoins: updatedCustomer.coins,
            addedCoins: arg.coins
          }
        }
      };
    } catch (error) {
      console.error("Error recharging coins:", error);
      return {
        success: false,
        message: "Gagal mengisi ulang coins"
      };
    }
  },
});