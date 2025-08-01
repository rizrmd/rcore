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

const customerCrudOptions: CrudApiOptions = {
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
        t_sales: {
          select: {
            id: true,
            total: true,
            status: true,
            created_at: true,
          },
          take: 5,
          orderBy: { created_at: "desc" },
        },
        customer_address: {
          select: {
            id: true,
            address: true,
            city: true,
            province: true,
            is_primary: true,
          },
          take: 3,
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
        t_sales: {
          orderBy: { created_at: "desc" },
          include: {
            t_sales_line: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    real_price: true,
                  },
                },
              },
            },
          },
        },
        customer_address: {
          orderBy: { created_at: "desc" },
        },
        customer_track: {
          orderBy: { ts: "desc" },
          take: 10,
        },
      },
    },
  },
  create: {
    before: async (data) => {
      return {
        name: data.name?.trim() || "",
        email: data.email?.trim(),
        whatsapp: data.whatsapp?.trim(),
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, auth_user, t_sales, customer_address, customer_track, ...updateData } = data;
      
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.email) updateData.email = updateData.email.trim();
      if (updateData.whatsapp) updateData.whatsapp = updateData.whatsapp.trim();

      return updateData;
    },
  },
  softDelete: {
    enabled: true,
    field: "deleted_at", 
    method: "null_is_available",
  },
  nested: {
    t_sales: {
      parentField: "id_customer",
      model: "t_sales",
      list: {
        prisma: {
          where: { deleted_at: null },
          include: {
            t_sales_line: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    real_price: true,
                  },
                },
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    },
    customer_address: {
      parentField: "id_customer",
      model: "customer_address",
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
            id_customer: data.id_customer,
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
  },
};

export default defineAPI({
  name: "customers",
  url: "/api/internal/customers",
  async handler(payload: any) {
    try {
      // Get authenticated internal user
      await getAuthenticatedInternal(this.req!);
      
      // Call the CRUD handler
      const handler = crudHandler("customer", customerCrudOptions);
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