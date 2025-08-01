import { defineAPI } from "rlib/server";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

export default defineAPI({
  name: "sample",
  url: "/api/sample",
  handler: crudHandler("customer", {
    list: {
      prisma: {
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp: true,
          deleted_at: true,
          id_default_address: true,
          // Include customer addresses to resolve default address
          customer_address: {
            select: {
              id: true,
              address: true,
              city: true,
              province: true,
            },
          },
        },
      },
    },
    get: {
      prisma: {
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp: true,
          deleted_at: true,
          id_default_address: true,
          customer_address: {
            select: {
              id: true,
              address: true,
              city: true,
              province: true,
              postal_code: true,
              is_primary: true,
              notes: true,
              id_subdistrict: true,
              regency: true,
              village: true,
              created_at: true,
              updated_at: true,
            },
            orderBy: {
              is_primary: "desc",
            },
          },
        },
      },
    },
    create: {
      before: async (data) => {
        if (data.name) {
          data.name = data.name.toUpperCase();
        }
        return data;
      },
      after: async (result) => {
        console.log("Executing afterCreate hook for customer", result.id);
        // e.g., send a notification or log the creation
      },
    },
    softDelete: {
      enabled: true,
      field: "deleted_at",
      method: "null_is_available",
    },
    nested: {
      customer_address: {
        parentField: "id_customer",
        model: "customer_address",
        create: {
          before: async (data) => {
            // Set defaults for required fields and proper type conversion
            return {
              address: data.address || "",
              city: data.city || "",
              province: data.province || "",
              postal_code: data.postal_code || "",
              regency: data.regency || data.city || "",
              village: data.village || "",
              is_primary: data.is_primary === true || data.is_primary === "true" || data.is_primary === 1,
              notes: data.notes || null,
              id_subdistrict: data.id_subdistrict || "",
              id_customer: data.id_customer, // Keep the parent relationship
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
  }),
});
