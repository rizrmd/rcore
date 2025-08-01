import { defineAPI } from "rlib/server";
import { auth } from "../../lib/better-auth";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";
import { generateUniqueSlug } from "shared/utils/slug";

// Create a function to get authenticated user
async function getAuthenticatedAuthor(req: any) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  if (!user || !user.idAuthor) {
    throw new Error("Authentication required - Author access only");
  }

  return { user, authorId: user.idAuthor };
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
            created_at: true,
          },
          take: 5,
          orderBy: { created_at: "desc" },
        },
        publisher_author: {
          include: {
            publisher: {
              select: {
                id: true,
                name: true,
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
          },
          orderBy: { created_at: "desc" },
        },
      },
    },
    author_address: {
      parentField: "id_author",
      model: "author_address",
      list: {
        prisma: {
          orderBy: { created_at: "desc" },
        },
      },
      create: {
        before: async (data) => {
          return {
            address: data.address?.trim() || "",
            city: data.city?.trim() || "",
            province: data.province?.trim() || "",
            postal_code: data.postal_code?.trim() || "",
            regency: data.regency?.trim() || "",
            village: data.village?.trim() || "",
            is_primary: data.is_primary === true || data.is_primary === "true" || data.is_primary === 1,
            notes: data.notes?.trim() || null,
            id_subdistrict: data.id_subdistrict?.trim() || "",
            id_author: data.id_author,
          };
        },
      },
      update: {
        before: async (data) => {
          return {
            ...data,
            is_primary: data.is_primary === true || data.is_primary === "true" || data.is_primary === 1,
            updated_at: new Date(),
          };
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
        },
      },
    },
  },
};

export default defineAPI({
  name: "authors",
  url: "/api/publish/authors",
  async handler(payload: any) {
    try {
      // Get authenticated user
      const { authorId } = await getAuthenticatedAuthor(this.req!);
      
      // For authors, they can only access their own record
      const { action } = payload;
      
      if (action === "list") {
        // Filter to only return the current user's author record
        payload.id = authorId;
      } else if (action === "get") {
        // Ensure they can only get their own author record
        if (payload.id !== authorId) {
          return {
            success: false,
            message: "Access denied - You can only access your own author record",
            status: 403
          };
        }
      } else if (action === "update") {
        // Ensure they can only update their own author record
        if (payload.id !== authorId) {
          return {
            success: false,
            message: "Access denied - You can only update your own author record", 
            status: 403
          };
        }
      }
      
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