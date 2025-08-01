import { defineAPI } from "rlib/server";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

const productCrudOptions: CrudApiOptions = {
  list: {
    prisma: {
      where: { deleted_at: null },
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
              },
            },
          },
        },
        product_category: {
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
        bundle_product: {
          select: {
            id: true,
            bundle: {
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
        book: {
          include: {
            author: true,
            chapter: {
              select: {
                id: true,
                title: true,
                chapter_number: true,
                status: true,
              },
              orderBy: { chapter_number: "asc" },
            },
          },
        },
        product_category: {
          include: {
            category: true,
          },
        },
        product_rating: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 10,
          orderBy: { created_at: "desc" },
        },
        bundle_product: {
          include: {
            bundle: true,
          },
        },
      },
    },
  },
  create: {
    before: async (data) => {
      return {
        name: data.name?.trim() || "",
        desc: data.desc?.trim(),
        price: data.price || 0,
        discount: data.discount || 0,
        status: data.status || "published",
        sku: data.sku?.trim(),
        id_book: data.id_book,
        weight: data.weight || 0,
        dimensions: data.dimensions,
        stock: data.stock || 0,
        min_order: data.min_order || 1,
        max_order: data.max_order,
        is_digital: data.is_digital || true,
        is_preorder: data.is_preorder || false,
        preorder_end_date: data.preorder_end_date,
        tags: data.tags,
        meta_title: data.meta_title?.trim(),
        meta_desc: data.meta_desc?.trim(),
        slug: data.slug?.trim(),
      };
    },
  },
  update: {
    before: async (data) => {
      // Filter out relation fields
      const { id, book, product_category, product_rating, bundle_product, ...updateData } = data;
      
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.desc) updateData.desc = updateData.desc.trim();
      if (updateData.sku) updateData.sku = updateData.sku.trim();
      if (updateData.meta_title) updateData.meta_title = updateData.meta_title.trim();
      if (updateData.meta_desc) updateData.meta_desc = updateData.meta_desc.trim();
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
    product_category: {
      parentField: "id_product",
      model: "product_category",
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
            id_product: data.id_product,
            id_category: data.id_category,
          };
        },
      },
    },
    product_rating: {
      parentField: "id_product",
      model: "product_rating",
      list: {
        prisma: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    },
    bundle_product: {
      parentField: "id_product",
      model: "bundle_product",
      list: {
        prisma: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                desc: true,
                price: true,
                status: true,
              },
            },
          },
        },
      },
    },
  },
};

export default defineAPI({
  name: "products",
  url: "/api/publish/products",
  handler: crudHandler("product", productCrudOptions),
});