import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";
import { BookStatus } from "shared/types";

interface Book {
  id: string;
  cover: string;
  desc: string | null;
  currency: string;
  name: string;
  submitted_price: any;
  slug: string;
}

interface GenreResponse {
  jsx: ReactElement;
  data: {
    title: string;
    products: Book[];
    page: number;
    pages: number;
  };
}

export default defineAPI({
  name: "genre",
  url: "/genre/:slug/:page",
  async handler(): Promise<GenreResponse> {
    const req = this.req!;
    const page = req.params?.page ? parseInt(req.params.page) : 1;
    const books_per_page = 20;
    const skip_books = page > 1 ? (page - 1) * books_per_page : 0;
    const genre_slug = req?.params.slug ? req.params.slug : ``;

    const genre = await db.genre.findFirst({
      where: {
        slug: genre_slug,
        deleted_at: null,
      },
      include: {
        book_genre: true,
      },
    });

    const books = await db.book.findMany({
      where: {
        id: {
          in: genre?.book_genre?.map((x) => x.id_book),
        },
        status: BookStatus.PUBLISHED,
        is_chapter: true,
        deleted_at: null,
      },
      select: {
        id: true,
        cover: true,
        desc: true,
        currency: true,
        name: true,
        submitted_price: true,
        slug: true,
      },
      skip: skip_books,
      take: books_per_page,
      orderBy: {
        published_date: "desc",
      },
    });

    const total_pages = Math.ceil(
      (await db.book.count({
        where: {
          id: {
            in: genre?.book_genre?.map((x) => x.id_book),
          },
          status: BookStatus.PUBLISHED,
          deleted_at: null,
        },
      })) / books_per_page
    );

    const data = {
      title: `Ebook tentang ${genre?.name}`,
      products: books,
      page: page,
      pages: total_pages,
      slug: genre_slug,
    };

    const seo_data = {
      slug: `/genre/${req.params?.slug ? `${req.params.slug}` : ``}${
        page > 1 ? `/${page}` : ``
      }`,
      page: page,
      meta_title: `Chapter Web Novel ${genre?.name} Terbaik | Koleksi Cerita ${genre?.name} di Esensi Online`,
      meta_description: `Temukan koleksi web novel ${genre?.name} di Esensi Online. Baca cerita ${genre?.name} yang seru, gratis, dan selalu update!`,
      image: ``,
      headings: `Chapter Web Novel ${genre?.name} di Esensi Online`,
      h2: `Rekomendasi Cerita ${genre?.name} Terbaik`,
      h3: `Update Terbaru di Kategori ${genre?.name}`,
      h4: `Jelajahi Cerita ${genre?.name} Lainnya di Esensi Online`,
      paragraph: `Kategori ${genre?.name} di Esensi Online menghadirkan cerita-cerita pilihan dengan tema ${genre?.name}. Cocok untuk kamu yang suka ${genre?.name}. Temukan web novel favoritmu di sini dan nikmati bacaan berkualitas setiap hari!`,
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