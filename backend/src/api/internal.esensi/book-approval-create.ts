import { baseUrl } from "backend/gen/base-url";
import {
  NotifStatus,
  NotifType,
  sendNotif,
  WSMessageAction,
} from "backend/lib/notif";
import { defineAPI } from "rlib/server";
import { BookStatus, type Book, type BookApproval } from "shared/types";
import type { ApiResponse } from "../../lib/utils";

export default defineAPI({
  name: "book_approval_create",
  url: "/api/internal/book-approval/create",
  async handler(arg: {
    id_book: string;
    comment: string;
    status?: BookStatus;
    id_internal?: string;
    book?: Book;
  }): Promise<ApiResponse<BookApproval>> {
    try {
      const book = await db.book.findUnique({ where: { id: arg.id_book } });
      if (!book) return { success: false, message: "Buku tidak ditemukan" };

      const created = await db.book_approval.create({
        data: {
          id_book: arg.id_book,
          comment: arg.comment,
          id_internal: arg.id_internal,
          status: arg.status,
        },
        include: {
          book: { include: { author: { include: { auth_user: true } } } },
          internal: true,
        },
      });

      if (!created)
        return { success: false, message: "Gagal menambahkan riwayat buku" };
      else {
        let id_product = undefined as string | undefined;
        if (arg.status === BookStatus.PUBLISHED && arg.book) {
          const createdProduct = await db.product.create({
            data: {
              name: arg.book.name!,
              slug: arg.book.slug!,
              alias: arg.book.alias,
              strike_price: arg.book.submitted_price,
              real_price: arg.book.submitted_price!,
              desc: arg.book.desc,
              info: arg.book.info ?? {},
              status: arg.book.status,
              currency: arg.book.currency,
              img_file: arg.book.img_file,
              cover: arg.book.cover,
              product_file: arg.book.product_file,
              sku: arg.book.sku,
              id_author: arg.book.id_author,
              is_physical: arg.book.is_physical,
              content_type: arg.book.content_type,
            },
            include: {
              author: true,
              bundle_product: { select: { bundle: true }, take: 10 },
              product_category: { select: { category: true }, take: 10 },
            },
          });
          id_product = createdProduct.id;
        }

        await db.book.update({
          where: { id: arg.id_book },
          data: { status: arg.status, id_product },
        });
      }

      const uid = created.book.author?.auth_user?.id;
      if (uid) {
        const notif = {
          id_user: uid,
          data: { bookId: created.id_book, approverId: arg.id_internal! },
          status: NotifStatus.UNREAD,
          timestamp: created.created_at.getTime(),
          thumbnail: created.book.cover,
        };
        if (arg.status === BookStatus.PUBLISHED) {
          const url = baseUrl.publish_esensi + "/book-sales?id=" + arg.id_book;
          await sendNotif(uid, {
            action: WSMessageAction.NEW_NOTIF,
            notif: {
              message: "Buku anda telah disetujui untuk terbit",
              type: NotifType.BOOK_PUBLISH,
              url,
              ...notif,
            },
          });
        } else if (arg.status === BookStatus.REJECTED) {
          const url = baseUrl.publish_esensi + "/book-detail?id=" + arg.id_book;
          await sendNotif(uid, {
            action: WSMessageAction.NEW_NOTIF,
            notif: {
              message: "Buku anda telah ditolak",
              type: NotifType.BOOK_REJECT,
              url,
              ...notif,
            },
          });
        } else if (
          book.status === BookStatus.SUBMITTED &&
          arg.status === BookStatus.DRAFT
        ) {
          const url = baseUrl.publish_esensi + "/book-update?id=" + arg.id_book;
          await sendNotif(uid, {
            action: WSMessageAction.NEW_NOTIF,
            notif: {
              message: "Buku anda harus direvisi",
              type: NotifType.BOOK_REVISE,
              url,
              ...notif,
            },
          });
        }
      }

      return { success: true, data: created };
    } catch (error) {
      console.error("Error in book approval create API:", error);
      return {
        success: false,
        message: "Terjadi kesalahan dalam menambahkan riwayat buku",
      };
    }
  },
});
