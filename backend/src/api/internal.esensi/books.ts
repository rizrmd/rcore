import { defineAPI } from "rlib/server";
import { auth } from "../../lib/better-auth";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

// Create a function to get authenticated internal user
async function getAuthenticatedInternal(req: any) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  if (!user || !user.idInternal) {
    throw new Error("Authentication required - Internal access only");
  }

  return { user, internalId: user.idInternal };
}

const bookCrudOptions: CrudApiOptions = {
  list: {
    prisma: {
      where: { deleted_at: null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            real_price: true,
            status: true,
          },
        },
        chapter: {
          select: {
            id: true,
            name: true,
            number: true,
          },
          take: 5,
          orderBy: { number: "asc" },
        },
        book_approval: {
          select: {
            id: true,
            status: true,
            comment: true,
            internal: {
              select: {
                id: true,
                name: true,
              },
            },
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 1,
        },
        book_tags: {
          select: {
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    },
  },
  get: {
    prisma: {
      include: {
        author: true,
        product: true,
        chapter: {
          orderBy: { number: "asc" },
        },
        book_approval: {
          include: {
            internal: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
        book_changes_log: {
          orderBy: { created_at: "desc" },
        },
        book_tags: {
          include: {
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
                img: true,
              },
            },
          },
        },
      },
    },
  },
  create: {
    before: async (data) => {
      return {
        name: data.name?.trim() || "",
        slug: data.slug?.trim() || "",
        alias: data.alias?.trim() || data.slug?.trim() || "",
        desc: data.desc?.trim() || "",
        submitted_price: data.submitted_price || 0,
        status: data.status || "draft",
        currency: data.currency || "IDR",
        cover: data.cover,
        product_file: data.product_file,
        img_file: data.img_file || data.cover,
        sku: data.sku || `BOOK-${Date.now()}`,
        id_author: data.id_author,
        is_physical: data.is_physical || false,
        is_chapter: data.is_chapter || false,
        story_type: data.story_type?.trim(),
        story_genre: data.story_genre?.trim(),
        story_language: data.story_language?.trim(),
        story_leading_gender: data.story_leading_gender,
        story_synopsis: data.story_synopsis?.trim(),
        story_tags: data.story_tags?.trim(),
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const {
        id,
        author,
        product,
        chapter,
        book_approval,
        book_changes_log,
        ...updateData
      } = data;

      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.slug) updateData.slug = updateData.slug.trim();
      if (updateData.alias) updateData.alias = updateData.alias.trim();
      if (updateData.desc) updateData.desc = updateData.desc.trim();
      if (updateData.story_type)
        updateData.story_type = updateData.story_type.trim();
      if (updateData.story_genre)
        updateData.story_genre = updateData.story_genre.trim();
      if (updateData.story_language)
        updateData.story_language = updateData.story_language.trim();
      if (updateData.story_synopsis)
        updateData.story_synopsis = updateData.story_synopsis.trim();
      if (updateData.story_tags)
        updateData.story_tags = updateData.story_tags.trim();

      return updateData;
    },
  },
  softDelete: {
    enabled: true,
    field: "deleted_at",
    method: "null_is_available",
  },
  nested: {
    chapter: {
      parentField: "id_book",
      model: "chapter",
      softDelete: {
        enabled: true,
        field: "deleted_at",
        method: "null_is_available",
      },
      list: {
        prisma: {
          orderBy: { number: "asc" },
        },
      },
      create: {
        before: async (data) => {
          return {
            name: data.name?.trim() || "",
            number: data.number || 1,
            content: data.content || {},
            id_book: data.id_book,
          };
        },
      },
      update: {
        before: async (data) => {
          return {
            ...data,
            updated_at: new Date(),
          };
        },
      },
    },
    book_approval: {
      parentField: "id_book",
      model: "book_approval",
      list: {
        prisma: {
          include: {
            internal: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
      create: {
        before: async (data) => {
          return {
            status: data.status || "pending",
            comment: data.comment?.trim(),
            id_book: data.id_book,
            id_internal: data.id_internal,
          };
        },
      },
      update: {
        before: async (data) => {
          return {
            ...data,
            updated_at: new Date(),
          };
        },
      },
    },
  },
};

export default defineAPI({
  name: "books",
  url: "/api/internal/books",
  async handler(payload: any) {
    try {
      // Get authenticated internal user
      await getAuthenticatedInternal(this.req!);

      // Call the CRUD handler
      const handler = crudHandler("book", bookCrudOptions);
      return await handler.call(this, payload);
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Authentication failed",
        status: 401,
      };
    }
  },
});
