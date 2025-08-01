import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "coin_packages",
  url: "/api/chapter/coin-packages",
  async handler() {
    try {
      // Fetch coin packages configuration
      const packagesConfig = await db.cfg.findUnique({
        where: { key: "coin_packages" }
      });

      // Fetch base price configuration
      const basePriceConfig = await db.cfg.findUnique({
        where: { key: "coins_baseprice" }
      });

      if (!packagesConfig || !basePriceConfig) {
        return {
          success: false,
          message: "Configuration not found"
        };
      }

      const packages = JSON.parse(packagesConfig.value);
      const basePrice = parseFloat(basePriceConfig.value);

      // Calculate prices for each package with discounts for larger packages
      const packagesWithPrices = packages.map((pkg: any, index: number) => {
        // Apply discount based on package size
        let discountMultiplier = 1;
        if (pkg.coins >= 10000) discountMultiplier = 0.7;      // 30% discount
        else if (pkg.coins >= 5000) discountMultiplier = 0.75; // 25% discount
        else if (pkg.coins >= 2000) discountMultiplier = 0.8;  // 20% discount
        else if (pkg.coins >= 1000) discountMultiplier = 0.85; // 15% discount
        else if (pkg.coins >= 500) discountMultiplier = 0.9;   // 10% discount

        const price = Math.round(pkg.coins * basePrice * discountMultiplier);

        return {
          id: index + 1,
          coins: pkg.coins,
          bonus: pkg.bonus_coins,
          price: price,
          discountPercentage: Math.round((1 - discountMultiplier) * 100)
        };
      });

      return {
        success: true,
        data: {
          packages: packagesWithPrices,
          basePrice: basePrice
        }
      };
    } catch (error) {
      console.error("Error fetching coin packages:", error);
      return {
        success: false,
        message: "Failed to fetch coin packages"
      };
    }
  },
});