import { ImgThumb } from "@/components/esensi/ui/img-thumb";
import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { SectionTitle } from "@/components/esensi/ui/section-title";
import {
  StoreBooksCard,
  type StoreBooksCardItem,
} from "@/components/esensi/store/store-books-card";
import { StoreBundling } from "@/components/esensi/store/store-bundling";
import {
  StoreCategories,
  type StoreCategoryItem,
} from "@/components/esensi/store/store-categories";
import { StoreFeaturedProducts } from "@/components/esensi/store/store-featured-products";
import { StoreHeaderBanner } from "@/components/esensi/store/store-header-banner";
import { api } from "@/lib/gen/main.esensi";

export default (data: Awaited<ReturnType<typeof api.index>>["data"]) => {
  const header_config = {
    enable: true,
    logo: true,
    back: false,
    search: true,
    title: null,
    cart: true,
    profile: true,
  };

  const local = {
    banner: {
      img: "",
      title: "",
      subtitle: "",
      button: {
        label: "",
        url: "",
        newTab: false,
      },
    } as any,
    featured_ebooks: {
      loading: true,
      list: [] as StoreCategoryItem[] | any,
      length: 0,
      offset: 0,
      animateClass: true,
    },
    featured_books: {
      loading: true,
      list: [] as StoreCategoryItem[] | any,
      length: 0,
      offset: 0,
      animateClass: true,
    },
    cats: {
      loading: true,
      list: [] as StoreCategoryItem[] | any,
      selected: "",
    },
    allbooks: {
      loading: true,
      list: [] as StoreBooksCardItem[] | any,
    },
    bundling: {
      slug: "" as any | null,
      img: "" as any | null,
      list: [] as StoreBooksCardItem[] | any,
    },
  };

  const getBooksByCategory = async (
    cat = null as string | null,
    limit = 12 as number
  ) => {
    const result = await api
      .index({
        init_cat: cat,
        limit: limit,
      })
      .then((res) => res.data.allbooks);
    return result;
  };

  const changeStoreCategory = (cat = "" as string, limit = 12 as number) => {
    local.allbooks.loading = true;
    local.cats.selected = cat;
    local.allbooks.list = getBooksByCategory(cat, limit);
    local.allbooks.loading = false;
  };

  /*
  const changeByCategory = async (cat = "" as string, limit = 8 as number) => {
    booksWithCats.loading = true;
    booksWithCats.render();
    booksWithCats.selected = cat;
    booksWithCats.render();
    booksWithCats.list = getBooksByCategory(cat, limit);
    booksWithCats.loading = false;
    booksWithCats.render();
  };
  */

  if (data?.banner) {
    local.banner = data.banner;
  }
  if (data?.categories) {
    local.cats.list = data.categories;
    local.cats.loading = false;
  }
  if (data?.featured_ebooks) {
    local.featured_ebooks.list = data.featured_ebooks;
    local.featured_ebooks.loading = false;
  }
  if (data?.featured_books) {
    local.featured_books.list = data.featured_books;
    local.featured_books.loading = false;
  }
  if (data?.allbooks) {
    local.allbooks.list = data.allbooks;
    local.allbooks.loading = false;
  }
  if (data?.bundling) {
    local.bundling = data.bundling;
  }

  return (
    <MainEsensiLayout header_config={header_config}>
      <div className="w-full flex flex-col justify-center items-center gap-10 lg:[&>div:not(.esensi-banner)]:max-w-[1200px]">
        <div className="esensi-banner order-1 lg:order-0 -mt-10 lg:mt-0 w-full">
          <StoreHeaderBanner
            img={local.banner?.img}
            title={local.banner?.title}
            subtitle={local.banner?.subtitle}
            btnlabel={local.banner?.button?.label}
            btnurl={local.banner?.button?.url}
            btnnewtab={local.banner?.button?.newTab}
          />
        </div>

        {local.featured_ebooks.list.length > 0 && (
          <div className="hidden lg:flex flex-col gap-6 px-6 w-full">
            <div className="hidden lg:flex w-full">
              <SectionTitle title="Ebook Unggulan" url="/ebook" />
            </div>
            <div className="flex">
              <div className="w-auto shrink-0">
                <ImgThumb
                  src="/img/browse-ebook.png"
                  alt="Baca langsung dari gadgetmu"
                  width={300}
                  skipResize={true}
                />
              </div>
              <div className="grow-1 overflow-x-auto">
                <StoreFeaturedProducts
                  data={local.featured_ebooks.list}
                  loading={local.featured_ebooks.loading}
                  animated={local.featured_ebooks.animateClass}
                />
              </div>
            </div>
          </div>
        )}


          <div className="hidden lg:flex flex-col gap-6 px-6 w-full">
            <div className="hidden lg:flex w-full">
              <SectionTitle title="Cetakan Fisik" url="/book" />
            </div>
            <div className="flex">
              <div className="w-auto shrink-0">
                <ImgThumb
                  src="/img/browse-buku.png"
                  alt="Koleksi Cetakan Fisik-nya"
                  width={300}
                  skipResize={true}
                />
              </div>
              <div className="grow-1 overflow-x-auto">
                <StoreFeaturedProducts
                  data={local.featured_books.list}
                  loading={local.featured_books.loading}
                  animated={local.featured_books.animateClass}
                />
              </div>
            </div>
          </div>


        <div className="flex flex-col gap-6 order-0 lg:order-none w-full">
          <div className="hidden lg:flex w-full">
            <SectionTitle
              title="Berdasarkan Genre"
              url={
                local.cats.selected !== ""
                  ? `/category/${local.cats.selected}`
                  : `/ebook`
              }
            />
          </div>
          <StoreCategories
            action={changeStoreCategory}
            loading={local.cats.loading}
            list={local.cats.list}
            selected={local.cats.selected}
          />
        </div>
        <div className="flex order-2 lg:order-none w-full lg:-mt-10">
          <StoreBooksCard
            loading={local.allbooks.loading}
            list={local.allbooks.list}
            category={local.cats.selected}
          />
        </div>
        <div className="flex flex-col gap-6 w-full order-3 lg:order-none">
          <div className="hidden lg:flex w-full">
            <SectionTitle
              title="Bundling of the Week"
              url="/bundles"
              btn_label="View All Bundles"
            />
          </div>
          <StoreBundling
            slug={local.bundling.slug}
            img={local.bundling.img}
            list={local.bundling.list}
          />
        </div>
        <div className="order-3 lg:order-none w-full">
          {/*}
          <BooksByCategory
            loading={booksWithCats.loading}
            action={changeByCategory}
            categories={local.cats.list}
            selected={booksWithCats.selected}
            list={booksWithCats.list}
          />
          */}
        </div>
      </div>
    </MainEsensiLayout>
  );
};
