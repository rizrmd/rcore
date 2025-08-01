import { defineAPI } from "rlib/server";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

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
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          take: 5,
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
                    created_at: true,
                  },
                  orderBy: { created_at: "desc" },
                },
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
        description: data.description?.trim(),
        website: data.website?.trim(),
        address: data.address?.trim(),
        logo: data.logo,
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, auth_user, publisher_author, ...updateData } = data;
      
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.description) updateData.description = updateData.description.trim();
      if (updateData.website) updateData.website = updateData.website.trim();
      if (updateData.address) updateData.address = updateData.address.trim();

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
                avatar: true,
                biography: true,
              },
            },
          },
        },
      },
      create: {
        before: async (data) => {
          return {
            publisher_id: data.publisher_id,
            author_id: data.author_id,
            role: data.role || "author",
            status: data.status || "active",
          };
        },
      },
    },
  },
};

export default defineAPI({
  name: "publishers",
  url: "/api/publish/publishers",
  handler: crudHandler("publisher", publisherCrudOptions),
});