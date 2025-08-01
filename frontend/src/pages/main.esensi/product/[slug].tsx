import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { CategoryList } from "@/components/esensi/store/category-list";
import { DiscountPercent } from "@/components/esensi/ui/discount-percent";
import { formatMoney } from "@/components/esensi/utils/format-money";
import { GlobalLoading } from "@/components/esensi/ui/global-loading";
import { ImgThumb } from "@/components/esensi/ui/img-thumb";
import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { ProductBuyButtons } from "@/components/esensi/cart/product-buy-buttons";
import { RelatedPost } from "@/components/esensi/ui/related-post";
import { api } from "@/lib/gen/main.esensi";
import {
  BookOpenText,
  MonitorSmartphone,
  Star,
  TriangleAlert,
} from "lucide-react";

export default (data: Awaited<ReturnType<typeof api.product>>["data"]) => {
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
    loading: !data?.product as boolean,
    product: data.product as any | null,
    rating: 5 as number,
    lang: "Indonesia" as string,
    pages: "-" as number | string,
    format: "PDF" as string,
    categories: data.categories as any[],
    owned: data.owned as boolean,
    bookmarked: data.bookmarked as boolean,
    inCart: data.in_cart as boolean,
    breadcrumb: data.breadcrumb as any,
    related: data.related as any,
  };

  const renderLoading = <GlobalLoading />;
  const renderNoProduct = <></>;

  const bookCover = local.loading ? (
    <></>
  ) : (
    <ImgThumb
      src={local.product?.cover}
      alt={local.product?.name}
      className="flex max-w-3/4 lg:max-w-[280px] aspect-3/4 object-center object-cover rounded-sm"
      width={320}
    />
  );

  const bookType =
    !local.loading && local.product?.is_physical === true ? (
      <span className="inline-flex gap-1 items-center px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-500 rounded-sm [&_svg]:h-[1em] [&_svg]:w-auto">
        <BookOpenText /> Buku Cetak
      </span>
    ) : (
      <span className="inline-flex gap-1 items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-500 rounded-sm [&_svg]:h-[1em] [&_svg]:w-auto">
        <MonitorSmartphone /> Ebook
      </span>
    );

  const bookPreOrder = !local.loading &&
    local.product?.preorder_min_qty !== null && (
      <span className="inline-flex gap-1 items-center px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-sm">
        <TriangleAlert /> Preorder
      </span>
    );
  const bookBadge = !local.loading && (
    <div className="flex justify-start w-full gap-3 [&_svg]:h-[1em] [&_svg]:w-auto">
      {bookType} {bookPreOrder}
    </div>
  );

  const bookTitle = local.loading ? (
    <></>
  ) : (
    <h2 className="flex text-[#3B2C93] text-lg lg:text-3xl font-semibold leading-[1.2]">
      {local.product?.name}
    </h2>
  );

  const bookCats = (
    <CategoryList
      data={local.categories}
      id={local.product?.slug}
      className="lg:order-4"
    />
  );
  console.log(local.product);
  const bookInfoData = [
    {
      label: "Penulis",
      value:
        local.product?.author &&
        local.product?.author !== null &&
        local.product.author?.name
          ? local.product.author.name
          : "-",
    },
    {
      label: "Penerbit",
      value:
        local.product?.author?.publisher_author?.[0]?.publisher?.name ||
        "Self Published",
    },
    {
      label: "Tahun",
      value:
        (local.product?.published_date &&
          (() => {
            let date = new Date(local.product.published_date);
            return date.getFullYear();
          })()) ||
        "-",
    },
  ];

  const bookInfo = bookInfoData.map((inf, idx) => {
    return (
      <div
        className={`flex flex-col gap-1 lg:gap-3 w-full py-2 px-4 lg:px-0 items-center justify-start lg:items-start relative${
          idx > 0 ? " " : ""
        }`}
        key={`esensi_product_info_${idx}`}
      >
        <div className="flex w-full font-medium leading-[1.2] text-sm text-[#383D6480]">
          {inf.label}
        </div>
        <div className="flex w-full text-xs lg:text-sm font-bold gap-1 [&>svg]:h-[1em]">
          {inf.label == "Rating" ? <Star /> : <></>} <span>{inf.value}</span>
        </div>
      </div>
    );
  });

  const bookBuyButton = (
    <ProductBuyButtons
      isOwned={local.owned}
      isBookmarked={local.bookmarked}
      productId={local.product?.id}
      productData={local.product}
    />
  );

  const bookRelated = (
    <RelatedPost 
      data={local.related} 
      loading={local.loading} 
      currentId={local.product?.id}
    />
  );

  const renderTheProduct = (
    <div className="flex flex-col items-center justify-start gap-10">
      <div className="flex flex-col container max-w-[1200px] items-center justify-start gap-5 lg:gap-15 px-6 pt-5">
        <div className="hidden lg:flex w-full justify-start">
          <Breadcrumbs data={local.breadcrumb} />
        </div>
        <div className="flex flex-col w-full items-center justify-start lg:flex-row lg:justify-start lg:items-start gap-5 lg:gap-15">
          <div className="flex flex-col gap-5 items-center justify-start lg:w-2/5">
            <div className="flex justify-center">{bookCover}</div>
          </div>
          <div className="flex w-full flex-col gap-5 items-center justify-start lg:grow-1 lg:items-start">
            <div className="flex w-full justify-between items-center gap-5 lg:order-0">
              <div className="flex flex-col flex-1 gap-1.5 justify-between">
                {bookBadge} {bookTitle}
              </div>
            </div>
            {bookCats}
            <div className="flex justify-start w-full items-start flex-col gap-1 lg:order-2">
              <DiscountPercent
                real_price={local.product?.real_price}
                strike_price={local.product?.strike_price}
                currency={local.product?.currency}
              />
              <span className="flex justify-start w-auto text-[#C6011B] text-left font-bold text-3xl">
                {formatMoney(
                  local.product?.real_price,
                  local.product?.currency
                )}
              </span>
            </div>
            <div className="flex justify-between w-full lg:w-auto lg:order-3 lg:gap-10 whitespace-pre py-2 [&>.esensi-with-separator]:border-l [&>.esensi-with-separator]:border-l-[#b4b0db]">
              {bookInfo}
            </div>
            {bookBuyButton}
          </div>
        </div>
        <div className="flex flex-col w-full gap-2 py-2">
          <h3 className="text-[#3B2C93] font-bold text-lg">Sinopsis Buku</h3>
          <div
            className="flex flex-col items-start justify-start w-full gap-4 overflow-x-hidden overflow-y-hidden text-wrap"
            dangerouslySetInnerHTML={{ __html: local.product?.desc }}
          ></div>
        </div>
      </div>
      {bookRelated}
    </div>
  );

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={false}>
      {local.loading
        ? renderLoading
        : local.product == null
        ? renderNoProduct
        : renderTheProduct}
    </MainEsensiLayout>
  );
};
