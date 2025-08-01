import { PrismaClient } from '@prisma/client';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export async function generateUniqueSlug(
  prisma: PrismaClient,
  name: string,
  table: 'author' | 'book' | 'bundle' | 'category' | 'genre' | 'tags',
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const whereClause: any = { slug };
    if (excludeId) {
      whereClause.NOT = { id: excludeId };
    }

    const existing = await (prisma[table] as any).findFirst({
      where: whereClause,
    });

    if (!existing) {
      break;
    }

    counter++;
    const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    slug = `${baseSlug}${randomDigits}`;
  }

  return slug;
}