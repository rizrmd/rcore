import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "gift_options",
  url: "/api/chapter/gift-options",
  async handler() {
    try {
      // Get gift items from gift_icons table
      const giftItems = await db.gift_icons.findMany({
        where: {
          enable: true
        },
        orderBy: {
          order: 'asc'
        }
      });

      // Transform data to match expected format
      const transformedGifts = giftItems.map(item => ({
        id: item.order, // Using order as id for backward compatibility
        name: item.name,
        emoji: item.emoji ? String.fromCodePoint(item.emoji) : "🎁", // Convert emoji codepoint back to string
        coins: item.coins
      }));
      
      return {
        success: true,
        data: transformedGifts
      };
    } catch (error) {
      console.error("Failed to fetch gift options:", error);
      return {
        success: false,
        message: "Failed to fetch gift options",
        data: []
      };
    }
  },
});