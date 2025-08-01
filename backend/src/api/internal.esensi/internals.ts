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

const internalCrudOptions: CrudApiOptions = {
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
        book_approval: {
          select: {
            id: true,
            status: true,
            book: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 5,
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { created_at: "desc" },
    },
  },
  get: {
    prisma: {
      include: {
        auth_user: true,
        book_approval: {
          include: {
            book: {
              select: {
                id: true,
                name: true,
                author: {
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
    },
  },
  create: {
    before: async (data) => {
      // If user_email is provided, find the user and validate
      if (data.user_email) {
        const targetUser = await db.auth_user.findFirst({
          where: { email: data.user_email },
          select: { id: true, id_internal: true }
        });

        if (!targetUser) {
          throw new Error(`User dengan email ${data.user_email} tidak ditemukan. User harus register akun terlebih dahulu.`);
        }

        if (targetUser.id_internal) {
          throw new Error(`User dengan email ${data.user_email} sudah memiliki akses internal.`);
        }

        // Create internal record first
        const internalData = {
          name: data.name?.trim() || "",
          is_management: data.is_management === true || data.is_management === "true" || data.is_management === 1,
          is_it: data.is_it === true || data.is_it === "true" || data.is_it === 1,
          is_sales_and_marketing: data.is_sales_and_marketing === true || data.is_sales_and_marketing === "true" || data.is_sales_and_marketing === 1,
          is_support: data.is_support === true || data.is_support === "true" || data.is_support === 1,
        };

        const internal = await db.internal.create({
          data: internalData
        });

        // Update auth_user with internal ID
        await db.auth_user.update({
          where: { id: targetUser.id },
          data: { id_internal: internal.id }
        });

        // Return the created internal record to prevent double creation
        return internal;
      }

      return {
        name: data.name?.trim() || "",
        is_management: data.is_management === true || data.is_management === "true" || data.is_management === 1,
        is_it: data.is_it === true || data.is_it === "true" || data.is_it === 1,
        is_sales_and_marketing: data.is_sales_and_marketing === true || data.is_sales_and_marketing === "true" || data.is_sales_and_marketing === 1,
        is_support: data.is_support === true || data.is_support === "true" || data.is_support === 1,
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, auth_user, book_approval, ...updateData } = data;
      
      if (updateData.name) updateData.name = updateData.name.trim();
      updateData.is_management = updateData.is_management === true || updateData.is_management === "true" || updateData.is_management === 1;
      updateData.is_it = updateData.is_it === true || updateData.is_it === "true" || updateData.is_it === 1;
      updateData.is_sales_and_marketing = updateData.is_sales_and_marketing === true || updateData.is_sales_and_marketing === "true" || updateData.is_sales_and_marketing === 1;
      updateData.is_support = updateData.is_support === true || updateData.is_support === "true" || updateData.is_support === 1;

      return updateData;
    },
  },
  softDelete: {
    enabled: true,
    field: "deleted_at", 
    method: "null_is_available",
  },
  nested: {
    book_approval: {
      parentField: "id_internal",
      model: "book_approval",
      list: {
        prisma: {
          include: {
            book: {
              select: {
                id: true,
                name: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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
            notes: data.notes?.trim(),
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
  name: "internals",
  url: "/api/internal/internals",
  async handler(payload: any) {
    try {
      // Get authenticated internal user (only management or IT can manage internal staff)
      const { user } = await getAuthenticatedInternal(this.req!);
      
      // Check if user has management or IT privileges
      const internal = await db.internal.findUnique({
        where: { id: user.idInternal! },
        select: { is_management: true, is_it: true }
      });
      
      if (!internal || (!internal.is_management && !internal.is_it)) {
        return {
          success: false,
          message: "Access denied - Management or IT role required",
          status: 403
        };
      }
      
      // Call the CRUD handler
      const handler = crudHandler("internal", internalCrudOptions);
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