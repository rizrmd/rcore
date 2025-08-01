import {
  bookCrudOptions,
  getAuthenticatedUser
} from "backend/components/publisher.book";
import { defineAPI } from "rlib/server";
import { crudHandler } from "../../lib/crud-handler";


export default defineAPI({
  name: "books",
  url: "/api/publish/books",
  async handler(payload: any) {
    try {
      // Get authenticated user (author or publisher)
      const { authorId, isAuthor, isPublisher } = await getAuthenticatedUser(
        this.req!
      );

      // Publishers can view all books but only authors can create/edit books
      if (
        !isAuthor &&
        (payload.action === "create" || payload.action === "update")
      ) {
        return {
          success: false,
          message: "Only authors can create or edit books",
          status: 403,
        };
      }

      // Modify payload to add user filtering based on action and role
      const { action } = payload;

      if (action === "list") {
        // Both authors and publishers should only see their own books
        if (isAuthor) {
          payload.id_author = authorId;
        }
      } else if (action === "get") {
        // For get operations, ensure we have an ID
        if (!payload.id) {
          return {
            success: false,
            message: "Book ID is required",
            status: 400,
          };
        }
        // Both authors and publishers can only get their own books
        if (isAuthor) {
          payload.id_author = authorId;
        }
      } else if (action === "create") {
        // Only authors can create books
        payload.id_author = authorId;
      } else if (action === "update") {
        // Only authors can update their own books
        payload.id_author = authorId;
      }

      // Add additional where conditions to the payload filters
      if (payload.where) {
        Object.assign(payload, payload.where);
        delete payload.where;
      }

      // Create modified CRUD options with user-specific filters
      const userBookCrudOptions = {
        ...bookCrudOptions,
        list: {
          ...bookCrudOptions.list,
          prisma: {
            ...bookCrudOptions.list?.prisma,
            where: {
              ...bookCrudOptions.list?.prisma?.where,
              ...(isAuthor
                ? {
                    id_author: authorId,
                  }
                : {}),
            },
          },
        },
        get: {
          ...bookCrudOptions.get,
          prisma: {
            ...bookCrudOptions.get?.prisma,
            where: {
              ...(isAuthor
                ? {
                    id_author: authorId,
                  }
                : {}),
            },
          },
        },
        update: {
          ...bookCrudOptions.update,
          prisma: {
            where: { id_author: authorId },
          },
        },
      };

      // Call the CRUD handler
      const handler = crudHandler("book", userBookCrudOptions);
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
