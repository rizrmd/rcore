import { SeoTemplate } from "backend/components/SeoTemplate";
import { defineAPI } from "rlib/server";
import { ProductStatus } from "shared/types";

export default defineAPI({
  name: "index",
  url: "/",
  async handler(arg: { init_cat: string | null; limit: number | null }) {
    const req = this.req!;

    let bundling = [] as any;

    const books_limit = arg?.limit !== 0 && arg?.limit !== null && arg?.limit !== undefined ? arg?.limit : 12;

    const whereClause: any = {
      status: ProductStatus.PUBLISHED,
      is_chapter: false,
      deleted_at: null,
    };

    if (arg?.init_cat !== "" && arg?.init_cat !== null && arg?.init_cat !== undefined) {
      const cat = await db.category.findFirst({
        where: {
          slug: arg?.init_cat,
          deleted_at: null,
        },
        include: {
          product_category: true,
        },
      });
      if (cat) {
        whereClause.id = {
          in: cat?.product_category?.map((x) => x.id_product),
        };
      }
    }

    const allbooks = await db.product.findMany({
      select: {
        name: true,
        real_price: true,
        strike_price: true,
        currency: true,
        cover: true,
        slug: true,
        is_physical: true,
        author:{
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: whereClause,
      take: books_limit,
      orderBy: {
        published_date: "desc",
      },
    });

    // Get all categories
    const get_categories = await db.category.findMany({
      where: {
        id_parent: null,
        deleted_at: null,
      },
      include: {
        other_category: {
          select: {
            name: true,
            slug: true,
            img: true,
          },
          where: {
            id_parent: { not: null },
            deleted_at: null,
          },
        },
      },
    });

    let categories = [] as any;
    get_categories.map((cat) => {
      if (cat?.other_category?.length === 0 && cat?.id_parent === null) {
        categories.push(cat);
      }
    });

    /*
    if (arg?.bundling_slug !== "" && arg?.bundling_slug !== null) {

      const the_bundle = await db.bundle.findFirst({
        where: {
          slug: arg?.bundling_slug,
          deleted_at: null,
        },
        include:{
          bundle_product: true,
        },
      });

      bundling = await db.product.findMany({
        select: {
          name: true,
          real_price: true,
          strike_price: true,
          currency: true,
          cover: true,
          slug: true,
          id_author: true,
        },
        where: {
          deleted_at: null,
          status: "published",
          id: {
            in: the_bundle?.bundle_product?.map((x) => x.id_product),
          },
        },
      });
    }
      */
    bundling = await db.bundle.findFirst({
      where: {
        deleted_at: null,
        status: "published",
      },
      include: {
        bundle_product: {
          select: {
            product: {
              select: {
                name: true,
                real_price: true,
                strike_price: true,
                currency: true,
                cover: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const featured_ebooks = await db.product.findMany({
      select: {
        name: true,
        real_price: true,
        strike_price: true,
        currency: true,
        cover: true,
        slug: true,
        is_physical: true,
        author:{
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: {
        deleted_at: null,
        status: "published",
        is_physical: false,
        is_chapter: false,
      },
      take: 10,
      orderBy: {
        published_date: "desc",
      },
    });

    const featured_books = await db.product.findMany({
      select: {
        name: true,
        real_price: true,
        strike_price: true,
        currency: true,
        cover: true,
        slug: true,
        is_physical: true,
        author:{
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: {
        deleted_at: null,
        status: "published",
        is_physical: true,
        is_chapter: false,
      },
      take: 10,
      orderBy: {
        published_date: "desc",
      },
    });

    const getBanner = await db.banner.findFirst({
      select: {
        banner_file: true,
      },
      where: {
        title: "banner-default",
        deleted_at: null,
      },
    });
    const banner_file = getBanner?.banner_file
      ? JSON.parse(getBanner.banner_file as string)
      : null;
    const header_banner = {
      img: banner_file ? banner_file[0] : null,
      title: "Dunia Baru Dimulai Dari Satu Halaman",
      subtitle: "Temukan ribuan judul ebook berkualitas di Esensi Online",
      button: {
        label: `Cari tahu`,
        url: `#`,
        newTab: false,
      },
    };

    /*
    const getBundleImg = await db.banner.findFirst({
      select: {
        banner_file: true,
      },
      where: {
        title: "bundle-square",
        deleted_at: null,
      },
    });
    const getBundleImgFile = getBundleImg?.banner_file
      ? JSON.parse(getBundleImg.banner_file as string)
      : null;
      */

    const data = {
      thecat:arg?.init_cat,
      title: `Esensi Online`,
      banner: header_banner,
      categories: categories,
      allbooks: allbooks,
      featured_ebooks: featured_ebooks,
      featured_books: featured_books,
      bundling: {
        slug: bundling?.slug || null,
        img: bundling?.cover || null,
        list: bundling?.bundle_product,
      },
    };

    const seo_data = {
      slug: `/`,
      meta_title: `Belanja Ebook Online | Temukan Ribuan Judul Ebook | Esensi Online`,
      meta_description: `Jelajahi koleksi eBook terbaik Indonesia. Temukan bacaan favorit Anda dan beli eBook berkualitas dengan harga terjangkau hanya di toko kami.`,
      image: ``,
      headings: `Belanja Ebook Online | Temukan Ribuan Judul Ebook | Esensi Online`,
      paragraph: `Jelajahi koleksi eBook terbaik Indonesia. Temukan bacaan favorit Anda dan beli eBook berkualitas dengan harga terjangkau hanya di toko kami.`,
      keywords: `toko buku,ebook`,
      is_product: false,
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
