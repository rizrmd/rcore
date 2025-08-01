import { defineAPI } from "rlib/server";
import { auth } from "../../lib/better-auth";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";
import { generateUniqueSlug } from "shared/utils/slug";

// Create a function to get authenticated internal user
async function getAuthenticatedInternal(req: any) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  if (!user || !user.idInternal) {
    throw new Error("Authentication required - Internal access only");
  }

  return { user, internalId: user.idInternal };
}

const authorCrudOptions: CrudApiOptions = {
  list: {
    prisma: {
      where: { deleted_at: null },
      include: {
        auth_user: {
          select: {
            id: true,
            name: true,
            email: true,
            email_verified: true,
          },
        },
        book: {
          select: {
            id: true,
            name: true,
            status: true,
            submitted_price: true,
            is_chapter: true,
            created_at: true,
          },
          take: 10,
          orderBy: { created_at: "desc" },
        },
        publisher_author: {
          include: {
            publisher: {
              select: {
                id: true,
                name: true,
                description: true,
                website: true,
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
        auth_user: true,
        book: {
          orderBy: { created_at: "desc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                real_price: true,
                status: true,
              },
            },
          },
        },
        author_address: {
          orderBy: { created_at: "desc" },
        },
        publisher_author: {
          include: {
            publisher: true,
          },
        },
      },
    },
  },
  create: {
    before: async (data) => {
      const name = data.name?.trim() || "";
      const slug = await generateUniqueSlug(db, name, 'author');
      return {
        name: name,
        slug: slug,
        avatar: data.avatar,
        biography: data.biography?.trim(),
        social_media: data.social_media,
        bank_account_number: data.bank_account_number?.trim(),
        bank_account_provider: data.bank_account_provider?.trim(),
        bank_account_holder: data.bank_account_holder?.trim(),
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, auth_user, book, author_address, publisher_author, ...updateData } = data;
      
      if (updateData.name) {
        updateData.name = updateData.name.trim();
        // Regenerate slug if name is changed
        updateData.slug = await generateUniqueSlug(db, updateData.name, 'author', id);
      }
      if (updateData.biography) updateData.biography = updateData.biography.trim();
      if (updateData.bank_account_number) updateData.bank_account_number = updateData.bank_account_number.trim();
      if (updateData.bank_account_provider) updateData.bank_account_provider = updateData.bank_account_provider.trim();
      if (updateData.bank_account_holder) updateData.bank_account_holder = updateData.bank_account_holder.trim();

      return updateData;
    },
  },
  softDelete: {
    enabled: true,
    field: "deleted_at", 
    method: "null_is_available",
  },
  nested: {
    book: {
      parentField: "id_author",
      model: "book",
      list: {
        prisma: {
          where: { deleted_at: null },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                real_price: true,
                status: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    },
    publisher_author: {
      parentField: "author_id",
      model: "publisher_author",
      list: {
        prisma: {
          include: {
            publisher: {
              select: {
                id: true,
                name: true,
                description: true,
                website: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
      create: {
        before: async (data) => {
          return {
            author_id: data.author_id,
            publisher_id: data.publisher_id,
          };
        },
      },
    },
  },
};

export default defineAPI({
  name: "authors",
  url: "/api/internal/authors",
  async handler(payload: any) {
    try {
      // Get authenticated internal user
      await getAuthenticatedInternal(this.req!);
      
      // Call the CRUD handler
      const handler = crudHandler("author", authorCrudOptions);
      return await handler.call(this, payload);
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Authentication failed",
        status: 401 
      };
    }
  },
});