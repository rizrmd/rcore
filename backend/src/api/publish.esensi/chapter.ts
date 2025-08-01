import { defineAPI } from "rlib/server";
import { auth } from "../../lib/better-auth";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

// Create a function to get authenticated user
async function getAuthenticatedAuthor(req: any) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  if (!user || !user.idAuthor) {
    throw new Error("Authentication required - Author access only");
  }

  return { user, authorId: user.idAuthor };
}

const chapterCrudOptions: CrudApiOptions = {
  list: {
    prisma: {
      select: {
        id: true,
        id_product: true,
        id_book: true,
        name: true,
        number: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        is_published: true,
        word_count: true,
        book: {
          select: {
            id: true,
            name: true,
            status: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ id_book: "asc" }, { number: "asc" }],
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
              },
            },
          },
        },
      },
    },
  },
  create: {
    before: async (data) => {
      // Ensure id_book is properly set
      if (!data.id_book) {
        throw new Error("Book ID is required to create a chapter");
      }

      // Auto-increment chapter number if not provided
      let chapterNumber = data.number;
      if (!chapterNumber) {
        const lastChapter = await db.chapter.findFirst({
          where: { id_book: data.id_book },
          orderBy: { number: "desc" },
          select: { number: true },
        });
        chapterNumber = lastChapter ? lastChapter.number + 1 : 1;
      }

      // Calculate word count from content
      let wordCount = 0;
      if (data.content) {
        try {
          const contentObj =
            typeof data.content === "string"
              ? JSON.parse(data.content)
              : data.content;

          if (contentObj?.blocks && Array.isArray(contentObj.blocks)) {
            wordCount = contentObj.blocks.reduce(
              (count: number, block: any) => {
                if (block?.data?.text) {
                  // Remove HTML tags and count words
                  const plainText = block.data.text.replace(/<[^>]*>/g, " ");
                  const words = plainText
                    .trim()
                    .split(/\s+/)
                    .filter((word: string) => word.length > 0);
                  return count + words.length;
                }
                return count;
              },
              0
            );
          }
        } catch (e) {
          console.error("Error parsing content for word count:", e);
        }
      }

      return {
        name: data.name?.trim() || "",
        content: data.content || '{"blocks": []}',
        number: chapterNumber,
        id_book: data.id_book,
        is_published: data.is_published || false,
        word_count: wordCount,
        coin_price: data.coin_price || 0,
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, book, ...updateData } = data;

      if (updateData.name) updateData.name = updateData.name.trim();

      // Calculate word count from content if content is being updated
      if (updateData.content) {
        let wordCount = 0;
        try {
          const contentObj =
            typeof updateData.content === "string"
              ? JSON.parse(updateData.content)
              : updateData.content;

          if (contentObj?.blocks && Array.isArray(contentObj.blocks)) {
            wordCount = contentObj.blocks.reduce(
              (count: number, block: any) => {
                if (block?.data?.text) {
                  // Remove HTML tags and count words
                  const plainText = block.data.text.replace(/<[^>]*>/g, " ");
                  const words = plainText
                    .trim()
                    .split(/\s+/)
                    .filter((word: string) => word.length > 0);
                  return count + words.length;
                }
                return count;
              },
              0
            );
          }
        } catch (e) {
          console.error("Error parsing content for word count:", e);
        }

        updateData.word_count = wordCount;
      }

      return updateData;
    },
  },
};

export default defineAPI({
  name: "chapters",
  url: "/api/publish/chapters",
  async handler(payload: any) {
    try {
      // Get authenticated user
      const { authorId } = await getAuthenticatedAuthor(this.req!);

      // For chapters, filter through book relationship
      const { action } = payload;

      // Create modified CRUD options with user-specific filters
      const userChapterCrudOptions = {
        ...chapterCrudOptions,
        list: {
          ...chapterCrudOptions.list,
          prisma: {
            ...chapterCrudOptions.list?.prisma,
            where: {
              book: {
                id_author: authorId,
              },
            },
          },
        },
        get: {
          ...chapterCrudOptions.get,
          prisma: {
            ...chapterCrudOptions.get?.prisma,
            where: {
              book: {
                id_author: authorId,
              },
            },
          },
        },
        update: {
          ...chapterCrudOptions.update,
          prisma: {
            where: {
              book: {
                id_author: authorId,
              },
            },
          },
        },
        delete: {
          prisma: {
            where: {
              book: {
                id_author: authorId,
              },
            },
          },
        },
      };

      // Call the CRUD handler
      const handler = crudHandler("chapter", userChapterCrudOptions);
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
