import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/main.esensi";

export default (data: Awaited<ReturnType<typeof api.read>>["data"]) => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Detail buku",
    cart: true,
    profile: true,
  };
  const local = {
    loading: true as boolean,
    product: null as any | null,
    owned: false as boolean,
  };

  if (data?.product) {
    local.product = data.product;
    local.owned = data.owned;
    local.loading = false;
  }

  const renderLoading = <></>;
  const renderNoAccess = (
    <div>Maaf, anda tidak memiliki akses ke ebook ini</div>
  );

  const renderTheProduct = (
    <div className="flex flex-col items-center justify-start gap-10">
      Baca PDF
    </div>
  );

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={false}>
      {local.loading
        ? renderLoading
        : local.product == null
        ? renderNoAccess
        : renderTheProduct}
    </MainEsensiLayout>
  );
};
