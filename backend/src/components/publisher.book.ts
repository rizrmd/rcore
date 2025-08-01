import { baseUrl } from "backend/gen/base-url";
import { auth } from "backend/lib/better-auth";
import type { CrudApiOptions } from "backend/lib/crud-handler";
import { sendNotif } from "backend/lib/notif";
import type { Prisma } from "shared/models";
import {
  BookStatus,
  NotifStatus,
  NotifType,
  WSMessageAction,
} from "shared/types";

// Create a function to get authenticated user (author or publisher)
export async function getAuthenticatedUser(req: any) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  if (!user) {
    throw new Error("Authentication required");
  }

  const isAuthor = !!user.idAuthor;
  const isPublisher = !!user.idPublisher;

  if (!isAuthor && !isPublisher) {
    throw new Error("Author or Publisher access required");
  }

  return {
    user,
    authorId: user.idAuthor,
    publisherId: user.idPublisher,
    isAuthor,
    isPublisher,
  };
}

export const bookCrudOptions: CrudApiOptions = {
  list: {
    prisma: {
      where: { deleted_at: null },
      select: {
        id: true,
        name: true,
        is_chapter: true,
        _count: {
          select: {
            chapter: true,
          },
        },
        book_tags: {
          select: {
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [{ created_at: "desc" }],
    } as Parameters<typeof db.book.findMany>[0],
  },
  get: {
    prisma: {
      include: {
        author: true,
        chapter: {
          orderBy: { number: "asc" },
        },
        book_tags: {
          include: {
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
                img: true,
              },
            },
          },
        },
      },
    },
    after: async (result) => {
      // Add hash_value to book_changes_log
      if (result.book_changes_log) {
        result.book_changes_log = result.book_changes_log.map((log: any) => ({
          ...log,
          hash_value: `${log.id_book}_${log.created_at.getTime()}`,
        }));
      }
    },
  },
  create: {
    before: async (data) => {
      // Generate slug from name if not provided
      const bookName = data.name?.trim() || "";
      let slug = data.slug?.trim() || "";

      if (!slug && bookName) {
        // Auto-generate slug from book name
        slug = bookName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "-") // Replace spaces with hyphens
          .replace(/-+/g, "-") // Replace multiple hyphens with single
          .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

        // Ensure slug is not empty
        if (!slug) {
          slug = "book-" + Date.now();
        }
      }

      // Set defaults for required fields
      const result: any = {
        name: bookName,
        slug: slug,
        alias: data.alias?.trim(),
        submitted_price: data.submitted_price || 0,
        desc: data.desc?.trim(),
        status: data.status || BookStatus.DRAFT,
        currency: data.currency || "IDR",
        sku: data.sku?.trim(),
        is_physical: data.is_physical || false,
        preorder_min_qty: data.preorder_min_qty || 0,
        content_type: data.content_type || "text",
        is_chapter: data.is_chapter !== undefined ? data.is_chapter : true,
        id_author: data.id_author, // Will be set by the handler
      };

      // Only add optional fields if they have valid values
      if (data.info !== undefined && data.info !== null)
        result.info = data.info;
      if (
        data.img_file !== undefined &&
        data.img_file !== null &&
        data.img_file !== "String"
      )
        result.img_file = data.img_file;
      if (
        data.cover !== undefined &&
        data.cover !== null &&
        data.cover !== "String"
      )
        result.cover = data.cover;
      if (
        data.product_file !== undefined &&
        data.product_file !== null &&
        data.product_file !== "String"
      )
        result.product_file = data.product_file;
      if (data.published_date !== undefined && data.published_date !== null)
        result.published_date = data.published_date;
      if (data.id_product !== undefined && data.id_product !== null)
        result.id_product = data.id_product;
      if (data.cfg !== undefined && data.cfg !== null) result.cfg = data.cfg;

      return result;
    },
    after: async (result) => {
      // Send notifications if book is submitted for approval
      if (result.status === BookStatus.SUBMITTED) {
        const author = await db.author.findUnique({
          where: { id: result.id_author },
          select: { name: true },
        });

        const internalUsers = await db.auth_user.findMany({
          where: { id_internal: { not: null } },
          select: { id: true },
        });

        for (const user of internalUsers) {
          const notif = {
            id_user: user.id,
            data: {
              bookId: result.id,
              submitterId: result.id_author,
            },
            url: baseUrl.internal_esensi + "/book-approval?id=" + result.id,
            status: NotifStatus.UNREAD,
            timestamp: new Date().getTime(),
            thumbnail: result.cover,
          };

          await sendNotif(user.id, {
            action: WSMessageAction.NEW_NOTIF,
            notif: {
              message: `${author?.name || "Author"} mengajukan buku ${
                result.name
              } untuk disetujui`,
              type: NotifType.BOOK_SUBMIT,
              ...notif,
            },
          });
        }
      }
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields and prepare data
      const {
        id,
        author,
        product,
        chapter,
        book_approval,
        book_changes_log,
        ...updateData
      } = data;

      // Clean up data
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.alias) updateData.alias = updateData.alias.trim();
      if (updateData.desc) updateData.desc = updateData.desc.trim();
      if (updateData.sku) updateData.sku = updateData.sku.trim();

      // Auto-generate slug if name changed but slug is empty or not provided
      if (
        updateData.name &&
        (!updateData.slug || updateData.slug.trim() === "")
      ) {
        updateData.slug = updateData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "-") // Replace spaces with hyphens
          .replace(/-+/g, "-") // Replace multiple hyphens with single
          .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

        // Ensure slug is not empty
        if (!updateData.slug) {
          updateData.slug = "book-" + Date.now();
        }
      } else if (updateData.slug) {
        updateData.slug = updateData.slug.trim();
      }

      return updateData;
    },
    after: async (result) => {
      // Change tracking has been temporarily disabled
      // The previous implementation had an issue where we couldn't access
      // the book ID in the before hook to fetch the previous values
      // TODO: Implement a different approach for change tracking
    },
  },
  softDelete: {
    enabled: true,
    field: "deleted_at",
    method: "null_is_available",
  },
  nested: {
    chapter: {
      parentField: "id_book",
      model: "chapter",
      list: {
        prisma: {
          orderBy: { number: "asc" },
        },
      },
      create: {
        before: async (data) => {
          return {
            name: data.name?.trim() || "",
            content: data.content || {},
            number: data.number || 1,
            id_book: data.id_book,
          };
        },
      },
      softDelete: {
        enabled: true,
        field: "deleted_at",
        method: "null_is_available",
      },
    },
    book_changes_log: {
      parentField: "id_book",
      model: "book_changes_log",
      list: {
        prisma: {
          orderBy: { created_at: "asc" },
        },
      },
    },
  },
};
