import { PrismaClient } from '../models';
import { generateUniqueSlug } from './slug';

async function migrateAuthorSlugs() {
  const prisma = new PrismaClient();

  try {
    // Get all authors without slug
    const authors = await prisma.author.findMany({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      }
    });

    console.log(`Found ${authors.length} authors without slug`);

    // Generate slug for each author
    for (const author of authors) {
      const slug = await generateUniqueSlug(prisma, author.name, 'author');
      
      await prisma.author.update({
        where: { id: author.id },
        data: { slug }
      });

      console.log(`Updated author ${author.name} with slug: ${slug}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateAuthorSlugs();
}