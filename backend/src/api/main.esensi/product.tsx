import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";
import { ProductStatus } from "shared/types";

export default defineAPI({
  name: "product",
  url: "/product/:slug",
  async handler() {
    const req = this.req!;

    // if slug == "_" redirect to /browse

    const product = await db.product.findFirst({
      where: {
        slug: req.params.slug,
        status: ProductStatus.PUBLISHED,
        deleted_at: null,
        is_chapter: false,
      },
      include: {
        author: {
          include: {
            publisher_author: {
              include: {
                publisher: {
                  select: { name: true, id: true },
                },
              },
            },
          },
        },
        product_category: {
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

    let cats = "";
    product?.product_category.map((cat) => {
      cats = cats + ", " + cat.category.name;
    });

    const relcatwhere = [] as any;
    const categories = product?.product_category.map((cat) => {
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
      product: product,
      categories: categories,
      owned: false,
      bookmarked: false,
      in_cart: false,
      breadcrumb: [
        {
          url: product?.is_physical ? `/book` : `/ebook`,
          label: `Semua ${product?.is_physical ? "Buku" : "E-Book"}`,
        },
        {
          url: null,
          label: `${product?.name}`,
        },
      ],
      related: relateds,
    };

    const seo_data = {
      slug: `/product/${req.params.slug}`,
      meta_title: `${product?.name} oleh ${product?.info} | Unduh Ebook Sekarang`,
      meta_description: `eBook ${product?.name} dengan tema ${cats}. Dapatkan sinopsis, preview, dan link unduh legal dengan aman, murah, dan terpercaya hanya di sini!`,
      image: `${product?.cover}`,
      headings: `${product?.name}`,
      paragraph: `${product?.desc}`,
      keywords: `${cats}`,
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
