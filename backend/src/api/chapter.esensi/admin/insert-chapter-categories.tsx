import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "admin-insert-chapter-categories",
  url: "/api/admin/insert-chapter-categories",
  async handler() {
    try {
      // Main category IDs
      const webnovel_id = crypto.randomUUID();
      const lightnovel_id = crypto.randomUUID();
      const fanfic_id = crypto.randomUUID();
      const original_id = crypto.randomUUID();
      const translated_id = crypto.randomUUID();
      
      // Create main categories
      await db.category.createMany({
        data: [
          { id: webnovel_id, name: 'Web Novel', slug: 'web-novel' },
          { id: lightnovel_id, name: 'Light Novel', slug: 'light-novel' },
          { id: fanfic_id, name: 'Fan Fiction', slug: 'fan-fiction' },
          { id: original_id, name: 'Karya Original', slug: 'karya-original' },
          { id: translated_id, name: 'Terjemahan', slug: 'terjemahan' },
          { name: 'Slice of Life', slug: 'slice-of-life' },
          { name: 'Psychological', slug: 'psychological' },
          { name: 'Supernatural', slug: 'supernatural' },
          { name: 'Sports', slug: 'sports' },
          { name: 'Historical', slug: 'historical' },
          { name: 'Harem', slug: 'harem' },
          { name: 'Reverse Harem', slug: 'reverse-harem' },
          { name: 'BL/Yaoi', slug: 'bl-yaoi' },
          { name: 'GL/Yuri', slug: 'gl-yuri' },
          { name: 'Gender Bender', slug: 'gender-bender' },
          { name: 'Tragedy', slug: 'tragedy' },
          { name: 'Mature', slug: 'mature' },
        ]
      });
      
      // Web Novel subcategory IDs
      const wn_romance_id = crypto.randomUUID();
      const wn_fantasy_id = crypto.randomUUID();
      const wn_action_id = crypto.randomUUID();
      const wn_comedy_id = crypto.randomUUID();
      const wn_drama_id = crypto.randomUUID();
      const wn_horror_id = crypto.randomUUID();
      const wn_scifi_id = crypto.randomUUID();
      const wn_mystery_id = crypto.randomUUID();
      
      // Insert Web Novel subcategories
      await db.category.createMany({
        data: [
          { id: wn_romance_id, name: 'Romance', slug: 'wn-romance', id_parent: webnovel_id },
          { id: wn_fantasy_id, name: 'Fantasy', slug: 'wn-fantasy', id_parent: webnovel_id },
          { id: wn_action_id, name: 'Action', slug: 'wn-action', id_parent: webnovel_id },
          { id: wn_comedy_id, name: 'Comedy', slug: 'wn-comedy', id_parent: webnovel_id },
          { id: wn_drama_id, name: 'Drama', slug: 'wn-drama', id_parent: webnovel_id },
          { id: wn_horror_id, name: 'Horror', slug: 'wn-horror', id_parent: webnovel_id },
          { id: wn_scifi_id, name: 'Sci-Fi', slug: 'wn-scifi', id_parent: webnovel_id },
          { id: wn_mystery_id, name: 'Mystery', slug: 'wn-mystery', id_parent: webnovel_id },
        ]
      });
      
      // Insert nested subcategories under Romance
      await db.category.createMany({
        data: [
          { name: 'Contemporary Romance', slug: 'contemporary-romance', id_parent: wn_romance_id },
          { name: 'Historical Romance', slug: 'historical-romance', id_parent: wn_romance_id },
          { name: 'Paranormal Romance', slug: 'paranormal-romance', id_parent: wn_romance_id },
          { name: 'Romance Comedy', slug: 'romance-comedy', id_parent: wn_romance_id },
          { name: 'Dark Romance', slug: 'dark-romance', id_parent: wn_romance_id },
        ]
      });
      
      // Insert nested subcategories under Fantasy
      await db.category.createMany({
        data: [
          { name: 'High Fantasy', slug: 'high-fantasy', id_parent: wn_fantasy_id },
          { name: 'Urban Fantasy', slug: 'urban-fantasy', id_parent: wn_fantasy_id },
          { name: 'Dark Fantasy', slug: 'dark-fantasy', id_parent: wn_fantasy_id },
          { name: 'Fantasy Adventure', slug: 'fantasy-adventure', id_parent: wn_fantasy_id },
          { name: 'Cultivation', slug: 'cultivation', id_parent: wn_fantasy_id },
          { name: 'Xianxia', slug: 'xianxia', id_parent: wn_fantasy_id },
          { name: 'Xuanhuan', slug: 'xuanhuan', id_parent: wn_fantasy_id },
        ]
      });
      
      // Insert nested subcategories under Action
      await db.category.createMany({
        data: [
          { name: 'Martial Arts', slug: 'martial-arts', id_parent: wn_action_id },
          { name: 'Military', slug: 'military', id_parent: wn_action_id },
          { name: 'Superhero', slug: 'superhero', id_parent: wn_action_id },
          { name: 'Wuxia', slug: 'wuxia', id_parent: wn_action_id },
        ]
      });
      
      // Light Novel subcategory IDs
      const ln_isekai_id = crypto.randomUUID();
      const ln_school_id = crypto.randomUUID();
      const ln_game_id = crypto.randomUUID();
      const ln_martial_id = crypto.randomUUID();
      
      // Insert Light Novel subcategories
      await db.category.createMany({
        data: [
          { id: ln_isekai_id, name: 'Isekai', slug: 'ln-isekai', id_parent: lightnovel_id },
          { id: ln_school_id, name: 'School Life', slug: 'ln-school-life', id_parent: lightnovel_id },
          { id: ln_game_id, name: 'Game', slug: 'ln-game', id_parent: lightnovel_id },
          { id: ln_martial_id, name: 'Martial Arts', slug: 'ln-martial-arts', id_parent: lightnovel_id },
        ]
      });
      
      // Insert nested subcategories under Isekai
      await db.category.createMany({
        data: [
          { name: 'Reincarnation', slug: 'reincarnation', id_parent: ln_isekai_id },
          { name: 'Transmigration', slug: 'transmigration', id_parent: ln_isekai_id },
          { name: 'Summoned Hero', slug: 'summoned-hero', id_parent: ln_isekai_id },
          { name: 'Otome Game', slug: 'otome-game', id_parent: ln_isekai_id },
        ]
      });
      
      // Insert nested subcategories under Game
      await db.category.createMany({
        data: [
          { name: 'VRMMO', slug: 'vrmmo', id_parent: ln_game_id },
          { name: 'Game World', slug: 'game-world', id_parent: ln_game_id },
          { name: 'LitRPG', slug: 'litrpg', id_parent: ln_game_id },
        ]
      });
      
      // Insert Fan Fiction subcategories
      await db.category.createMany({
        data: [
          { name: 'Anime Fanfic', slug: 'anime-fanfic', id_parent: fanfic_id },
          { name: 'Manga Fanfic', slug: 'manga-fanfic', id_parent: fanfic_id },
          { name: 'Game Fanfic', slug: 'game-fanfic', id_parent: fanfic_id },
          { name: 'Movie Fanfic', slug: 'movie-fanfic', id_parent: fanfic_id },
          { name: 'K-Pop Fanfic', slug: 'kpop-fanfic', id_parent: fanfic_id },
          { name: 'Crossover', slug: 'crossover', id_parent: fanfic_id },
        ]
      });
      
      // Original Work subcategory IDs
      const orig_indo_id = crypto.randomUUID();
      const orig_eng_id = crypto.randomUUID();
      
      // Insert Original Work subcategories
      await db.category.createMany({
        data: [
          { id: orig_indo_id, name: 'Karya Indonesia', slug: 'karya-indonesia', id_parent: original_id },
          { id: orig_eng_id, name: 'English Original', slug: 'english-original', id_parent: original_id },
        ]
      });
      
      // Insert nested subcategories under Karya Indonesia
      await db.category.createMany({
        data: [
          { name: 'Novel Indonesia', slug: 'novel-indonesia', id_parent: orig_indo_id },
          { name: 'Cerpen Indonesia', slug: 'cerpen-indonesia', id_parent: orig_indo_id },
          { name: 'Puisi Indonesia', slug: 'puisi-indonesia', id_parent: orig_indo_id },
        ]
      });
      
      // Insert Translated Work subcategories
      await db.category.createMany({
        data: [
          { name: 'Chinese Novel', slug: 'chinese-novel', id_parent: translated_id },
          { name: 'Korean Novel', slug: 'korean-novel', id_parent: translated_id },
          { name: 'Japanese Novel', slug: 'japanese-novel', id_parent: translated_id },
          { name: 'English Novel', slug: 'english-novel', id_parent: translated_id },
        ]
      });
      
      // Get the total count and hierarchy
      const totalCategories = await db.category.count({
        where: { deleted_at: null }
      });
      
      // Get main categories with their children for verification
      const mainCategories = await db.category.findMany({
        where: {
          id_parent: null,
          deleted_at: null
        },
        include: {
          other_category: {
            include: {
              other_category: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      
      return {
        data: {
          success: true,
          message: `Successfully inserted ${totalCategories} chapter book categories`,
          totalCategories,
          mainCategories: mainCategories.map(cat => ({
            name: cat.name,
            slug: cat.slug,
            childrenCount: cat.other_category.length,
            totalDescendants: cat.other_category.reduce(
              (sum, child) => sum + 1 + child.other_category.length, 
              0
            )
          }))
        }
      };
      
    } catch (error) {
      console.error('Error inserting categories:', error);
      return {
        data: {
          success: false,
          message: `Error inserting categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.toString() : String(error)
        }
      };
    }
  },
});