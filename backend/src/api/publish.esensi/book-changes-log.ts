import { defineAPI } from "rlib/server";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

const bookChangesLogCrudOptions: CrudApiOptions = {
  list: {
    prisma: {
      include: {
        book: {
          select: {
            id: true,
            name: true,
            status: true,
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    },
    after: async (results) => {
      // Add hash_value for each log entry
      if (Array.isArray(results)) {
        return results.map((log: any) => ({
          ...log,
          hash_value: `${log.id_book}_${log.created_at.getTime()}`,
        }));
      }
      return results;
    },
  },
  get: {
    prisma: {
      include: {
        book: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                biography: true,
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
          },
        },
      },
    },
    after: async (result) => {
      // Add hash_value to the result
      if (result) {
        return {
          ...result,
          hash_value: `${result.id_book}_${result.created_at.getTime()}`,
        };
      }
      return result;
    },
  },
  create: {
    before: async (data) => {
      return {
        id_book: data.id_book,
        changes: data.changes || {},
        created_at: data.created_at || new Date(),
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields and prepare data
      const { book, ...updateData } = data;

      return updateData;
    },
  },
  // Note: No softDelete for this table as it doesn't have a deleted_at field
  // This table uses cascade delete when the parent book is deleted
};

export default defineAPI({
  name: "book-changes-log",
  url: "/api/publish/book-changes-log",
  handler: crudHandler("book_changes_log", bookChangesLogCrudOptions),
});
