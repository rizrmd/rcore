import { defineAPI } from "rlib/server";
import { auth } from "../../lib/better-auth";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

// Create a function to get authenticated internal user
async function getAuthenticatedInternal(req: any) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  if (!user || !user.idInternal) {
    throw new Error("Authentication required - Internal access only");
  }

  return { user, internalId: user.idInternal };
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
        slug: slug,
        real_price: data.real_price || 0,
        strike_price: data.strike_price,
        currency: data.currency || "Rp.",
        desc: data.desc?.trim() || "",
        info: data.info || {},
        status: data.status || "draft",
        img_file: data.img_file || "[]",
        cover: data.cover || "",
        sku: data.sku || `BUNDLE-${Date.now()}`,
        cfg: data.cfg,
        id_author: data.id_author,
        id_publisher: data.id_publisher,
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, author, bundle_product, bundle_category, ...updateData } = data;
      
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.desc) updateData.desc = updateData.desc.trim();
      if (updateData.slug) updateData.slug = updateData.slug.trim();

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
  url: "/api/internal/bundles",
  async handler(payload: any) {
    try {
      // Get authenticated internal user
      await getAuthenticatedInternal(this.req!);
      
      // Call the CRUD handler
      const handler = crudHandler("bundle", bundleCrudOptions);
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