import { defineAPI } from "rlib/server";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

const withdrawalCrudOptions: CrudApiOptions = {
  list: {
    prisma: {
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        publisher: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { requested_at: "desc" },
    },
  },
  get: {
    prisma: {
      include: {
        author: true,
        publisher: true,
      },
    },
  },
  create: {
    before: async (data) => {
      return {
        amount: data.amount || 0,
        status: data.status || "pending",
        id_author: data.id_author,
        id_publisher: data.id_publisher,
        processed_at: data.processed_at,
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, author, publisher, ...updateData } = data;
      
      return updateData;
    },
  },
};

export default defineAPI({
  name: "withdrawals",
  url: "/api/publish/withdrawals",
  handler: crudHandler("withdrawal", withdrawalCrudOptions),
});