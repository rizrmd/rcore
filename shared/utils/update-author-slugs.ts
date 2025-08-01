import { PrismaClient } from '../models';
import { generateUniqueSlug } from './slug';

async function updateAuthorSlugs() {
  const prisma = new PrismaClient();

  try {
    // Get all authors
    const authors = await prisma.author.findMany();

    console.log(`Found ${authors.length} authors to update`);

    // Update slug for each author
    for (const author of authors) {
      const newSlug = await generateUniqueSlug(prisma, author.name, 'author', author.id);
      
      await prisma.author.update({
        where: { id: author.id },
        data: { slug: newSlug }
      });

      console.log(`Updated author ${author.name}: ${author.slug} -> ${newSlug}`);
    }

    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  updateAuthorSlugs();
}