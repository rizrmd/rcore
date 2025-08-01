import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "test_gift_options",
  url: "/api/chapter/test-gift-options",
  async handler() {
    try {
      // Manually insert gift items for testing
      const giftItems = [
        { id: 1, name: "Rendang", emoji: "🍛", coins: 10 },
        { id: 2, name: "Sate", emoji: "🍢", coins: 50 },
        { id: 3, name: "Nasi Goreng", emoji: "🍳", coins: 100 },
        { id: 4, name: "Gado-gado", emoji: "🥗", coins: 500 },
        { id: 5, name: "Bakso", emoji: "🍲", coins: 1000 },
        { id: 6, name: "Martabak", emoji: "🥞", coins: 2000 },
        { id: 7, name: "Tumpeng", emoji: "🍚", coins: 5000 },
        { id: 8, name: "Nasi Padang", emoji: "🍱", coins: 10000 },
      ];

      // Check if already exists
      const existing = await db.cfg.findUnique({
        where: { key: "gift_items" }
      });

      if (!existing) {
        await db.cfg.create({
          data: {
            key: "gift_items",
            value: JSON.stringify(giftItems)
          }
        });
        return {
          success: true,
          message: "Gift items created successfully",
          data: giftItems
        };
      } else {
        return {
          success: true,
          message: "Gift items already exist",
          data: JSON.parse(existing.value)
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Error managing gift items",
        error: error.message
      };
    }
  }
});