import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "insert_dummy_tags",
  url: "/api/internal/insert-dummy-tags",
  async handler() {
    const tagsData = [
      { name: "Romantis", slug: "romantis" },
      { name: "Komedi", slug: "komedi" },
      { name: "Drama", slug: "drama" },
      { name: "Petualangan", slug: "petualangan" },
      { name: "Fantasi", slug: "fantasi" },
      { name: "Misteri", slug: "misteri" },
      { name: "Thriller", slug: "thriller" },
      { name: "Horor", slug: "horor" },
      { name: "Fiksi Ilmiah", slug: "fiksi-ilmiah" },
      { name: "Sejarah", slug: "sejarah" },
      { name: "Biografi", slug: "biografi" },
      { name: "Motivasi", slug: "motivasi" },
      { name: "Pengembangan Diri", slug: "pengembangan-diri" },
      { name: "Bisnis", slug: "bisnis" },
      { name: "Keuangan", slug: "keuangan" },
      { name: "Teknologi", slug: "teknologi" },
      { name: "Kesehatan", slug: "kesehatan" },
      { name: "Kuliner", slug: "kuliner" },
      { name: "Traveling", slug: "traveling" },
      { name: "Olahraga", slug: "olahraga" },
      { name: "Musik", slug: "musik" },
      { name: "Seni", slug: "seni" },
      { name: "Fotografi", slug: "fotografi" },
      { name: "Politik", slug: "politik" },
      { name: "Agama", slug: "agama" },
      { name: "Filsafat", slug: "filsafat" },
      { name: "Psikologi", slug: "psikologi" },
      { name: "Pendidikan", slug: "pendidikan" },
      { name: "Anak-anak", slug: "anak-anak" },
      { name: "Remaja", slug: "remaja" }
    ];

    const result = [];
    
    for (const tag of tagsData) {
      try {
        // Check if tag already exists
        const existingTag = await db.tags.findFirst({
          where: {
            OR: [
              { name: tag.name },
              { slug: tag.slug }
            ]
          }
        });

        if (!existingTag) {
          const newTag = await db.tags.create({
            data: {
              name: tag.name,
              slug: tag.slug
            }
          });
          result.push(newTag);
        } else {
          result.push({ ...existingTag, status: "already_exists" });
        }
      } catch (error) {
        result.push({ 
          name: tag.name, 
          error: error instanceof Error ? error.message : String(error),
          status: "error" 
        });
      }
    }

    return {
      success: true,
      message: `Berhasil memproses ${tagsData.length} tag`,
      data: result,
      summary: {
        total: tagsData.length,
        created: result.filter(r => !('status' in r)).length,
        existing: result.filter(r => 'status' in r && r.status === "already_exists").length,
        errors: result.filter(r => 'status' in r && r.status === "error").length
      }
    };
  },
});