import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { LayoutBookList } from "@/components/esensi/layout/layout-book-list";
import { api } from "@/lib/gen/main.esensi";

export default (data: Awaited<ReturnType<typeof api.book>>["data"]) => {
  const header_config = {
    enable: true,
    logo: true,
    back: false,
    search: true,
    title: null,
    cart: true,
    profile: true,
  };

  const title = data?.pagination
    ? `Dunia Baru Dimulai dari Satu Halaman${
        data.pagination.page > 1 ? ` | Page #${data.pagination.page}` : ""
      }`
    : "Dunia Baru Dimulai dari Satu Halaman";

  return (
    <MainEsensiLayout header_config={header_config}>
      <LayoutBookList
        title={title}
        loading={!data?.list}
        list={data?.list || []}
        pagination={
          data?.pagination || {
            items: 20,
            page: 1,
            total_pages: 1,
            url: { prefix: "", suffix: "" },
          }
        }
        isBundle={false}
        breadcrumb={data?.breadcrumb || []}
        categories={data?.categories || []}
        authors={data?.authors || []}
        banner_img={data?.banner_img || null}
      />
    </MainEsensiLayout>
  );
};
