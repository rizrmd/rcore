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

const bundleCrudOptions: CrudApiOptions = {
  list: {
    prisma: {
      where: { deleted_at: null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        bundle_product: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                real_price: true,
                book: {
                  select: {
                    id: true,
                    name: true,
                    author: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          take: 5,
        },
        bundle_category: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 3,
        },
      },
      orderBy: { created_at: "desc" },
    },
  },
  get: {
    prisma: {
      include: {
        author: true,
        bundle_product: {
          include: {
            product: {
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
        },
        bundle_category: {
          include: {
            category: true,
          },
        },
      },
    },
  },
  create: {
    before: async (data) => {
      // Generate slug from name if not provided
      const bundleName = data.name?.trim() || "";
      let slug = data.slug?.trim() || "";
      
      if (!slug && bundleName) {
        // Auto-generate slug from bundle name
        slug = bundleName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-')         // Replace spaces with hyphens
          .replace(/-+/g, '-')          // Replace multiple hyphens with single
          .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
        
        // Ensure slug is not empty
        if (!slug) {
          slug = 'bundle-' + Date.now();
        }
      }

      return {
        name: bundleName,
        desc: data.desc?.trim(),
        real_price: data.real_price || 0,
        discount: data.discount || 0,
        status: data.status || "draft",
        image: data.image,
        slug: slug,
        meta_title: data.meta_title?.trim(),
        meta_desc: data.meta_desc?.trim(),
        is_featured: data.is_featured || false,
        sort_order: data.sort_order || 0,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
        max_purchases: data.max_purchases,
        tags: data.tags,
        id_author: data.id_author, // Will be set by the handler
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, bundle_product, bundle_category, ...updateData } = data;
      
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.desc) updateData.desc = updateData.desc.trim();
      if (updateData.slug) updateData.slug = updateData.slug.trim();
      if (updateData.meta_title) updateData.meta_title = updateData.meta_title.trim();
      if (updateData.meta_desc) updateData.meta_desc = updateData.meta_desc.trim();

      return updateData;
    },
  },
  softDelete: {
    enabled: true,
    field: "deleted_at",
    method: "null_is_available",
  },
  nested: {
    bundle_product: {
      parentField: "id_bundle",
      model: "bundle_product",
      list: {
        prisma: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                real_price: true,
                book: {
                  select: {
                    id: true,
                    name: true,
                    author: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
      create: {
        before: async (data) => {
          return {
            id_bundle: data.id_bundle,
            id_product: data.id_product,
            qty: data.qty || 1,
          };
        },
      },
    },
    bundle_category: {
      parentField: "id_bundle",
      model: "bundle_category",
      list: {
        prisma: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      create: {
        before: async (data) => {
          return {
            id_bundle: data.id_bundle,
            id_category: data.id_category,
          };
        },
      },
    },
  },
};

export default defineAPI({
  name: "bundles",
  url: "/api/publish/bundles",
  async handler(payload: any) {
    try {
      // Get authenticated user
      const { authorId } = await getAuthenticatedAuthor(this.req!);
      
      // Modify payload to add user filtering based on action
      const { action } = payload;
      
      if (action === "list") {
        // Add author filter to list queries
        payload.id_author = authorId;
      } else if (action === "get") {
        // For get operations, add author filter
        payload.id_author = authorId;
      } else if (action === "create") {
        // For create operations, ensure the author ID is set
        payload.id_author = authorId;
      } else if (action === "update") {
        // For update operations, add author filter to ensure ownership
        payload.id_author = authorId;
      }
      
      // Create modified CRUD options with user-specific filters
      const userBundleCrudOptions = {
        ...bundleCrudOptions,
        update: {
          ...bundleCrudOptions.update,
          prisma: {
            where: { id_author: authorId }
          }
        }
      };
      
      // Call the CRUD handler
      const handler = crudHandler("bundle", userBundleCrudOptions);
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