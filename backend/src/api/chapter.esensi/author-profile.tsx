import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "author_profile",
  url: "/author/:slug",
  async handler() {
    const req = this.req!;
    const slug = req?.params?.slug;
    
    if (!slug?.trim()) {
      return {
        jsx: null,
        data: null,
      };
    }

    const author = await db.author.findFirst({
      where: { 
        slug,
        deleted_at: null 
      },
      include: {
        auth_user: {
          select: {
            id: true,
            name: true,
            email_verified: true,
          }
        },
        book: {
          where: {
            deleted_at: null,
            status: "published"
          },
          orderBy: { published_date: "desc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                real_price: true,
                status: true,
              }
            },
            book_genre: {
              include: {
                genre: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            },
            _count: {
              select: {
                chapter: true,
                book_likes: true
              }
            }
          }
        },
        _count: {
          select: {
            book: {
              where: {
                deleted_at: null,
                status: "published"
              }
            }
          }
        }
      },
    });

    if (!author) {
      return {
        jsx: null,
        data: null,
      };
    }

    return {
      jsx: null,
      data: author,
    };
  },
});