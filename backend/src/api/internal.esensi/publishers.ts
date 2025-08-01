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

const publisherCrudOptions: CrudApiOptions = {
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
        publisher_author: {
          select: {
            id: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 5,
        },
        transaction: {
          select: {
            id: true,
            amount: true,
            type: true,
            created_at: true,
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
        publisher_author: {
          include: {
            author: {
              include: {
                book: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                  take: 5,
                  orderBy: { created_at: "desc" },
                },
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
        transaction: {
          orderBy: { created_at: "desc" },
        },
        promo_code: {
          orderBy: { created_at: "desc" },
        },
        withdrawal: {
          orderBy: { created_at: "desc" },
        },
      },
    },
  },
  create: {
    before: async (data) => {
      return {
        name: data.name?.trim() || "",
        description: data.description?.trim(),
        website: data.website?.trim(),
        address: data.address?.trim(),
        logo: data.logo,
        bank_account_number: data.bank_account_number?.trim(),
        bank_account_provider: data.bank_account_provider?.trim(),
        bank_account_holder: data.bank_account_holder?.trim(),
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, auth_user, publisher_author, transaction, promo_code, withdrawal, ...updateData } = data;
      
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.description) updateData.description = updateData.description.trim();
      if (updateData.website) updateData.website = updateData.website.trim();
      if (updateData.address) updateData.address = updateData.address.trim();
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
    publisher_author: {
      parentField: "publisher_id",
      model: "publisher_author",
      list: {
        prisma: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                biography: true,
              },
            },
          },
          orderBy: { id: "desc" },
        },
      },
      create: {
        before: async (data) => {
          return {
            publisher_id: data.publisher_id,
            author_id: data.author_id,
          };
        },
      },
    },
    transaction: {
      parentField: "id_publisher",
      model: "transaction",
      list: {
        prisma: {
          include: {
            publisher: {
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
  },
};

export default defineAPI({
  name: "publishers",
  url: "/api/internal/publishers",
  async handler(payload: any) {
    try {
      // Get authenticated internal user
      await getAuthenticatedInternal(this.req!);
      
      // Call the CRUD handler
      const handler = crudHandler("publisher", publisherCrudOptions);
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