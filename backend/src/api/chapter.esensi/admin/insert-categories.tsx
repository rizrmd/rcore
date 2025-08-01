import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "admin-insert-categories",
  url: "/api/admin/insert-categories",
  async handler() {
    try {
      // Parent category IDs
      const fiksi_id = crypto.randomUUID();
      const non_fiksi_id = crypto.randomUUID();
      const komik_id = crypto.randomUUID();
      const akademik_id = crypto.randomUUID();
      const lifestyle_id = crypto.randomUUID();
      
      // Create main parent categories
      await db.category.createMany({
        data: [
          { id: fiksi_id, name: 'Fiksi', slug: 'fiksi', id_parent: null },
          { id: non_fiksi_id, name: 'Non-Fiksi', slug: 'non-fiksi', id_parent: null },
          { id: komik_id, name: 'Komik & Graphic Novel', slug: 'komik-graphic-novel', id_parent: null },
          { id: akademik_id, name: 'Akademik & Pendidikan', slug: 'akademik-pendidikan', id_parent: null },
          { id: lifestyle_id, name: 'Lifestyle & Hobi', slug: 'lifestyle-hobi', id_parent: null },
        ]
      });
      
      // Sub-category IDs
      const novel_id = crypto.randomUUID();
      const cerpen_id = crypto.randomUUID();
      const biografi_id = crypto.randomUUID();
      const self_help_id = crypto.randomUUID();
      const manga_id = crypto.randomUUID();
      const manhwa_id = crypto.randomUUID();
      
      // Insert subcategories under Fiksi
      await db.category.createMany({
        data: [
          { id: novel_id, name: 'Novel', slug: 'novel', id_parent: fiksi_id },
          { id: cerpen_id, name: 'Cerpen', slug: 'cerpen', id_parent: fiksi_id },
          { name: 'Puisi', slug: 'puisi', id_parent: fiksi_id },
          { name: 'Dongeng & Fabel', slug: 'dongeng-fabel', id_parent: fiksi_id },
          { name: 'Fanfiction', slug: 'fanfiction', id_parent: fiksi_id },
        ]
      });
      
      // Insert nested subcategories under Novel
      await db.category.createMany({
        data: [
          { name: 'Novel Romantis', slug: 'novel-romantis', id_parent: novel_id },
          { name: 'Novel Fantasi', slug: 'novel-fantasi', id_parent: novel_id },
          { name: 'Novel Misteri', slug: 'novel-misteri', id_parent: novel_id },
          { name: 'Novel Thriller', slug: 'novel-thriller', id_parent: novel_id },
          { name: 'Novel Horor', slug: 'novel-horor', id_parent: novel_id },
          { name: 'Novel Sejarah', slug: 'novel-sejarah', id_parent: novel_id },
          { name: 'Novel Remaja', slug: 'novel-remaja', id_parent: novel_id },
        ]
      });
      
      // Insert nested subcategories under Cerpen
      await db.category.createMany({
        data: [
          { name: 'Cerpen Cinta', slug: 'cerpen-cinta', id_parent: cerpen_id },
          { name: 'Cerpen Inspiratif', slug: 'cerpen-inspiratif', id_parent: cerpen_id },
          { name: 'Cerpen Anak', slug: 'cerpen-anak', id_parent: cerpen_id },
          { name: 'Cerpen Religi', slug: 'cerpen-religi', id_parent: cerpen_id },
        ]
      });
      
      // Insert subcategories under Non-Fiksi
      await db.category.createMany({
        data: [
          { id: biografi_id, name: 'Biografi & Memoar', slug: 'biografi-memoar', id_parent: non_fiksi_id },
          { id: self_help_id, name: 'Self-Help', slug: 'self-help', id_parent: non_fiksi_id },
          { name: 'Sejarah', slug: 'sejarah', id_parent: non_fiksi_id },
          { name: 'Sains & Teknologi', slug: 'sains-teknologi', id_parent: non_fiksi_id },
          { name: 'Bisnis & Ekonomi', slug: 'bisnis-ekonomi', id_parent: non_fiksi_id },
          { name: 'Politik & Hukum', slug: 'politik-hukum', id_parent: non_fiksi_id },
          { name: 'Filsafat', slug: 'filsafat', id_parent: non_fiksi_id },
          { name: 'Agama & Spiritualitas', slug: 'agama-spiritualitas', id_parent: non_fiksi_id },
        ]
      });
      
      // Insert nested subcategories under Self-Help
      await db.category.createMany({
        data: [
          { name: 'Motivasi', slug: 'motivasi', id_parent: self_help_id },
          { name: 'Pengembangan Diri', slug: 'pengembangan-diri', id_parent: self_help_id },
          { name: 'Produktivitas', slug: 'produktivitas', id_parent: self_help_id },
          { name: 'Kesehatan Mental', slug: 'kesehatan-mental', id_parent: self_help_id },
        ]
      });
      
      // Insert subcategories under Komik & Graphic Novel
      await db.category.createMany({
        data: [
          { id: manga_id, name: 'Manga', slug: 'manga', id_parent: komik_id },
          { id: manhwa_id, name: 'Manhwa', slug: 'manhwa', id_parent: komik_id },
          { name: 'Komik Lokal', slug: 'komik-lokal', id_parent: komik_id },
          { name: 'Webtoon', slug: 'webtoon', id_parent: komik_id },
          { name: 'Comic Strip', slug: 'comic-strip', id_parent: komik_id },
        ]
      });
      
      // Insert nested subcategories under Manga
      await db.category.createMany({
        data: [
          { name: 'Shonen', slug: 'shonen', id_parent: manga_id },
          { name: 'Shojo', slug: 'shojo', id_parent: manga_id },
          { name: 'Seinen', slug: 'seinen', id_parent: manga_id },
          { name: 'Josei', slug: 'josei', id_parent: manga_id },
        ]
      });
      
      // Insert subcategories under Akademik & Pendidikan
      await db.category.createMany({
        data: [
          { name: 'Pelajaran Sekolah', slug: 'pelajaran-sekolah', id_parent: akademik_id },
          { name: 'Kuliah & Universitas', slug: 'kuliah-universitas', id_parent: akademik_id },
          { name: 'Bahasa & Linguistik', slug: 'bahasa-linguistik', id_parent: akademik_id },
          { name: 'Riset & Jurnal', slug: 'riset-jurnal', id_parent: akademik_id },
          { name: 'Tutorial & Panduan', slug: 'tutorial-panduan', id_parent: akademik_id },
        ]
      });
      
      // Insert subcategories under Lifestyle & Hobi
      await db.category.createMany({
        data: [
          { name: 'Kuliner & Resep', slug: 'kuliner-resep', id_parent: lifestyle_id },
          { name: 'Travel & Wisata', slug: 'travel-wisata', id_parent: lifestyle_id },
          { name: 'Fashion & Beauty', slug: 'fashion-beauty', id_parent: lifestyle_id },
          { name: 'Olahraga & Fitness', slug: 'olahraga-fitness', id_parent: lifestyle_id },
          { name: 'Seni & Kreativitas', slug: 'seni-kreativitas', id_parent: lifestyle_id },
          { name: 'Gaming', slug: 'gaming', id_parent: lifestyle_id },
          { name: 'Fotografi', slug: 'fotografi', id_parent: lifestyle_id },
          { name: 'Musik', slug: 'musik', id_parent: lifestyle_id },
        ]
      });
      
      // Get count of inserted categories
      const categoriesCount = await db.category.count({
        where: {
          deleted_at: null
        }
      });
      
      return {
        data: {
          success: true,
          message: `Successfully inserted dummy categories. Total categories: ${categoriesCount}`,
          totalCategories: categoriesCount
        }
      };
      
    } catch (error) {
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