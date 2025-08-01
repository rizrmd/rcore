import type CSS from "csstype";
import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { CategoryList } from "@/components/esensi/store/category-list";

export default (data: Awaited<ReturnType<typeof api.search>>["data"]) => {
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
    title: "" as string,
    loading: true as boolean,
    list: [] as any[],
    trending: [] as any | null,
    categories: [] as any | null,
  };

  const localBanner = useLocal({
    img: `` as string,
  }, async()=>{
    const res = await api.banner({ for: "booklist" });
    if (res?.data) {
      localBanner.img = res.data?.img;
    }
    localBanner.render();
  });

  if (data?.categories) {
    local.categories = data.categories;
    local.trending = data.trending;
    local.title = `Cari Ebook terbaik di Esensi Online`;
    local.loading = false;
  }

  const bannerCSS: CSS.Properties = {
    backgroundImage: `url(/${localBanner.img})`,
  };

  const renderTrending = local.trending !== null &&
    local.trending.length > 0 && (
      <div className="flex w-full items-start flex-col gap-3">
        <h3 className="font-bold text-[#393B69]">Populer</h3>
        <div className="flex flex-col gap-2"></div>
      </div>
    );
  const renderCategories = local.categories !== null &&
    local.categories.length > 0 && (
      <div className="flex w-full items-start flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <CategoryList data={local.categories} hideTitle={true}/>
        </div>
      </div>
    );
  return (
    <MainEsensiLayout header_config={header_config}>
      <div className="flex flex-col w-full items-center">
        <div className="flex flex-col justify-center w-full max-w-[1200px] py-10 gap-3">
          <h2 className="font-bold text-[#393B69] px-4 text-lg text-center">Temukan buku terbaik di Esensi Online.</h2>
          <p className="px-4 text-center">Bingung mau cari buku yang dimau? Coba cek beberapa rekomendasi dari kami berdasarkan kategori berikut ini:</p>
          <div className="flex flex-col items-start p-4">
            {renderTrending}
            {renderCategories}
          </div>
        </div>
      </div>
    </MainEsensiLayout>
  );
};
