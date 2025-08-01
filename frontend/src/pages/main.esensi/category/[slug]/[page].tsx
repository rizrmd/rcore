import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { LayoutBookList } from "@/components/esensi/layout/layout-book-list";
import { api } from "@/lib/gen/main.esensi";
import type { Banner } from "shared/types";

export default (data: Awaited<ReturnType<typeof api.category>>["data"]) => {
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
    pagination: {
      items: 20 as number,
      page: 1 as number,
      total_pages: 1 as number,
      url: {
        prefix: "" as string,
        suffix: "" as string,
      },
    } as any,
    breadcrumb: [] as any,
    isBundle: false as boolean,
    categories: [] as any[],
    authors: [] as any[],
    skipFilters: ["cat"],
    banner_img: null as string | null,
  };

  if (data) {
    local.list = data.list;
    local.pagination = data.pagination;
    local.authors = data.authors || [];
    local.banner_img = data.banner_img || null;
    if (data.pagination?.page) {
      local.title = `${data.title}${
        data.pagination.page > 1 ? ` | Page #${data.pagination.page}` : ""
      }`;
    }
    local.breadcrumb = data.breadcrumb;
    local.loading = false;
  } else {
    local.loading = true;
  }

  return (
    <MainEsensiLayout header_config={header_config}>
      <LayoutBookList
        title={local.title}
        loading={local.loading}
        list={local.list}
        pagination={local.pagination}
        isBundle={local.isBundle}
        breadcrumb={local.breadcrumb}
        categories={local.categories}
        authors={local.authors}
        skipFilters={local.skipFilters}
        banner_img={local.banner_img || null}
      />
    </MainEsensiLayout>
  );
};
