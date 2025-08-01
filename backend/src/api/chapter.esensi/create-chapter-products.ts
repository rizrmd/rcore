import { defineAPI } from "rlib/server";

// Ensure db is available
declare global {
  var db: any;
}

export default defineAPI({
  name: "create_chapter_products",
  url: "/api/chapter/create-chapter-products",
  async handler(arg?: { dryRun?: boolean }) {
    try {
      // Find all chapters that don't have an associated product
      const chaptersWithoutProduct = await db.chapter.findMany({
        where: {
          id_product: null,
          deleted_at: null,
          is_published: true
        },
        include: {
          book: {
            select: {
              name: true,
              slug: true,
              cover: true,
              id_author: true
            }
          }
        }
      });

      if (chaptersWithoutProduct.length === 0) {
        return {
          success: true,
          message: "No chapters without products found",
          processed: 0
        };
      }

      // If dry run, just return the chapters that would be processed
      if (arg?.dryRun) {
        return {
          success: true,
          message: `Found ${chaptersWithoutProduct.length} chapters without products (dry run)`,
          dryRun: true,
          chapters: chaptersWithoutProduct.map(chapter => ({
            id: chapter.id,
            name: chapter.name,
            number: chapter.number,
            slug: chapter.slug,
            coin_price: chapter.coin_price,
            book_name: chapter.book?.name,
            book_slug: chapter.book?.slug
          }))
        };
      }

      let processedCount = 0;
      const results = [];

      for (const chapter of chaptersWithoutProduct) {
        try {
          // Create a product for this chapter with shorter field values
          const bookName = chapter.book?.name || 'Unknown Book';
          const chapterName = chapter.name || `Chapter ${chapter.number}`;
          
          // Truncate long names to prevent database errors
          const truncatedBookName = bookName.length > 30 ? bookName.substring(0, 30) + '...' : bookName;
          const truncatedChapterName = chapterName.length > 50 ? chapterName.substring(0, 50) + '...' : chapterName;
          
          const product = await db.product.create({
            data: {
              name: `${truncatedBookName} - Ch${chapter.number}: ${truncatedChapterName}`,
              slug: `chapter-${chapter.number}-${chapter.slug}`.substring(0, 100), // Limit slug length
              alias: `Chapter ${chapter.number}`,
              real_price: chapter.coin_price,
              desc: `Chapter ${chapter.number} dari ${truncatedBookName}`,
              info: {
                chapterId: chapter.id,
                chapterNumber: chapter.number,
                chapterName: chapter.name,
                wordCount: chapter.word_count
              },
              status: "published",
              currency: "Coins",
              cover: chapter.book?.cover || "",
              id_author: chapter.book?.id_author || null,
              is_chapter: true,
              content_type: "chapter",
              published_date: chapter.created_at
            }
          });

          // Update the chapter to link to the new product
          await db.chapter.update({
            where: { id: chapter.id },
            data: { id_product: product.id }
          });

          processedCount++;
          results.push({
            chapterId: chapter.id,
            chapterName: chapter.name,
            productId: product.id,
            productName: product.name,
            status: "success"
          });

        } catch (error) {
          console.error(`Error creating product for chapter ${chapter.id}:`, error);
          results.push({
            chapterId: chapter.id,
            chapterName: chapter.name,
            error: error.message,
            status: "error"
          });
        }
      }

      return {
        success: true,
        message: `Processed ${processedCount} chapters out of ${chaptersWithoutProduct.length} found`,
        processed: processedCount,
        total: chaptersWithoutProduct.length,
        results: results
      };

    } catch (error) {
      console.error("Error in create_chapter_products:", error);
      return {
        success: false,
        message: "Failed to create chapter products",
        error: error.message
      };
    }
  },
});