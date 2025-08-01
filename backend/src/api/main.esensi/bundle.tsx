import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";
import { ProductStatus } from "shared/types";

interface BundleProduct {
  product: {
    id: string;
    name: string;
    slug: string;
    cover: string;
    strike_price: any;
    real_price: any;
    currency: string;
    product_file: string | null;
  };
}

interface BundleResponse {
  jsx: ReactElement;
  data: {
    title: string;
    product: any;
    categories:
      | Array<{
          name: string;
          slug: string | null;
        }>
      | undefined;
    owned: boolean;
    bookmarked: boolean;
    in_cart: boolean;
    breadcrumb: Array<{
      url: string | null;
      label: string;
    }>;
    related: Array<{
      id: string;
      cover: string;
      desc: string | null;
      currency: string;
      name: string;
      real_price: any;
      strike_price: any;
      slug: string;
    }>;
  };
}

export default defineAPI({
  name: "bundle",
  url: "/bundle/:slug",
  async handler(): Promise<BundleResponse> {
    const req = this.req!;

    const product = await db.bundle.findFirst({
      where: { slug: req.params.slug, deleted_at: null, status: "published" },
      include: {
        bundle_product: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                cover: true,
                strike_price: true,
                real_price: true,
                currency: true,
                product_file: true,
                is_physical: true,
              },
            },
          },

          where: {
            product: {
              status: ProductStatus.PUBLISHED,
              deleted_at: null,
              is_chapter: false,
            },
          },
        },
        bundle_category: {
          select: {
            category: {
              select: { name: true, slug: true },
            },
          },
          where: {
            category: {
              deleted_at: null,
            },
          },
        },
      },
    });

    const qty = product?.bundle_product.length;
    let cats = "";
    product?.bundle_category.map((cat) => {
      cats = cats + ", " + cat.category.name;
    });

    const relcatwhere = [] as any;
    const categories = product?.bundle_category.map((cat) => {
      relcatwhere.push({
        slug: cat.category.slug,
        deleted_at: null,
      });
      return {
        name: cat.category.name,
        slug: cat.category.slug,
      };
    });

    const relcat = await db.category.findFirst({
      where: {
        OR: relcatwhere,
      },
      include: {
        product_category: true,
      },
    });

    const relateds = await db.product.findMany({
      where: {
        id: {
          in: relcat?.product_category?.map((x) => x.id_product),
        },
        status: ProductStatus.PUBLISHED,
        deleted_at: null,
      },
      select: {
        id: true,
        cover: true,
        desc: true,
        currency: true,
        name: true,
        real_price: true,
        strike_price: true,
        slug: true,
      },
      skip: 0,
      take: 10,
      orderBy: {
        published_date: "desc",
      },
    });

    const data = {
      title: `Detail Bundle`,
      product: product,
      categories: categories,
      owned: false,
      bookmarked: false,
      in_cart: false,
      breadcrumb: [
        {
          url: "/bundles",
          label: `Bundle Hemat`,
        },
        {
          url: null,
          label: `${product?.name}`,
        },
      ],
      related: relateds,
    };

    const seo_data = {
      slug: `/bundle/${req.params.slug}`,
      meta_title: `${product?.name} | Paket bundle Ebook lebih hemat sekaligus`,
      meta_description: `Beli ${qty} ebook lebih hemat dengan bundle ${product?.name}. Dapatkan koleksi lebih lengkap dengan harga spesial.`,
      image: `${product?.cover}`,
      headings: `${product?.name}`,
      paragraph: `${product?.desc}`,
      is_product: true,
      price: product?.real_price,
      currencry: product?.currency,
    };

    return {
      jsx: (
        <>
          <SeoTemplate data={seo_data} />
        </>
      ),
      data: data,
    };
  },
});
