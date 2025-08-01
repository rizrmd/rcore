import { defineAPI } from "rlib/server";
import { utils } from "../../lib/better-auth";

export default defineAPI({
  name: "buy_coins_temp",
  url: "/api/chapter/buy-coins-temp",
  async handler(arg: { packageId: number }) {
    const req = this.req!;
    const sessionData = await utils.getSession(req.headers);
    
    // Check if user is logged in
    if (!sessionData?.user?.id) {
      return {
        success: false,
        message: "Anda harus login untuk membeli coins"
      };
    }
    
    try {
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

      // Get coin packages configuration
      const packagesConfig = await db.cfg.findUnique({
        where: { key: "coin_packages" }
      });

      if (!packagesConfig) {
        return {
          success: false,
          message: "Konfigurasi paket coins tidak ditemukan"
        };
      }

      const packages = JSON.parse(packagesConfig.value);
      const selectedPackage = packages[arg.packageId - 1];

      if (!selectedPackage) {
        return {
          success: false,
          message: "Paket coins tidak valid"
        };
      }

      const totalCoins = selectedPackage.coins + (selectedPackage.bonus_coins || 0);

      // Add coins to customer
      const updatedCustomer = await db.customer.update({
        where: { id: customer.id },
        data: {
          coins: customer.coins + totalCoins
        }
      });

      // Log the transaction
      await db.coins_logs.create({
        data: {
          id_customer: customer.id,
          type: "temp_purchase",
          coins: totalCoins,
          notes: `Temporary purchase - Package ${arg.packageId}: ${selectedPackage.coins} coins${selectedPackage.bonus_coins ? ` + ${selectedPackage.bonus_coins} bonus` : ''}`
        }
      });

      return {
        success: true,
        message: `Berhasil membeli ${totalCoins} coins!`,
        data: {
          package: {
            id: arg.packageId,
            coins: selectedPackage.coins,
            bonusCoins: selectedPackage.bonus_coins || 0,
            totalCoins: totalCoins
          },
          customer: {
            name: customer.name,
            previousCoins: customer.coins,
            newCoins: updatedCustomer.coins,
            addedCoins: totalCoins
          }
        }
      };
    } catch (error) {
      console.error("Error buying coins:", error);
      return {
        success: false,
        message: "Gagal membeli coins"
      };
    }
  },
});