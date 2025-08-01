import { defineAPI } from "rlib/server";
import { auth } from "../../lib/better-auth";

async function getAuthenticatedAuthor(req: any) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user || !user.idAuthor) {
    throw new Error("Authentication required - Author access only");
  }
  return { user, authorId: user.idAuthor };
}

export default defineAPI({
  name: "chapter-content-save",
  url: "/api/publish/chapter-content-save",
  async handler(payload: { id: string; content: string }) {
    const { authorId } = await getAuthenticatedAuthor(this.req!);

    if (!payload.id) {
      throw new Error("Chapter ID is required");
    }

    if (typeof payload.content !== "string") {
      throw new Error("Content must be a string");
    }

    // Verify chapter ownership through book relationship
    const chapter = await db.chapter.findFirst({
      where: {
        id: payload.id,
        book: {
          id_author: authorId,
        },
      },
      select: {
        id: true,
        content: true,
      },
    });

    if (!chapter) {
      throw new Error("Chapter not found or access denied");
    }

    // Only update if content has changed to avoid unnecessary writes
    if (chapter.content === payload.content) {
      return {
        success: true,
        message: "Content unchanged",
        timestamp: new Date().toISOString(),
      };
    }

    // Calculate word count from content
    let wordCount = 0;
    try {
      const contentObj =
        typeof payload.content === "string"
          ? JSON.parse(payload.content)
          : payload.content;

      if (Array.isArray(contentObj)) {
        // Slate.js format - array of blocks
        wordCount = contentObj.reduce((count: number, block: any) => {
          if (block?.children) {
            return (
              count +
              block.children.reduce((childCount: number, child: any) => {
                if (child?.text) {
                  const words = child.text
                    .trim()
                    .split(/\s+/)
                    .filter((word: string) => word.length > 0);
                  return childCount + words.length;
                }
                return childCount;
              }, 0)
            );
          }
          return count;
        }, 0);
      } else if (contentObj?.blocks && Array.isArray(contentObj.blocks)) {
        // Editor.js format
        wordCount = contentObj.blocks.reduce((count: number, block: any) => {
          if (block?.data?.text) {
            const plainText = block.data.text.replace(/<[^>]*>/g, " ");
            const words = plainText
              .trim()
              .split(/\s+/)
              .filter((word: string) => word.length > 0);
            return count + words.length;
          }
          return count;
        }, 0);
      }
    } catch (e) {
      console.error("Error parsing content for word count:", e);
    }

    // Update content and word count while preserving other fields
    await db.chapter.update({
      where: { id: payload.id },
      data: {
        content: payload.content,
        word_count: wordCount,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: "Content saved successfully",
      timestamp: new Date().toISOString(),
      wordCount,
    };
  },
});
