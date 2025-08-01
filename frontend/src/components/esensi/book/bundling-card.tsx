import { Link } from "@/lib/router";
import { formatMoney } from "../utils/format-money";
import { DiscountPercent } from "../ui/discount-percent";
import { ImgThumb } from "../ui/img-thumb";

export const BundlingCard = ({ data }) => {
  let strikePrice: any;
  if (
    data.strike_price !== null &&
    data.strike_price !== "" &&
    data.strike_price > data.real_price
  ) {
    strikePrice = formatMoney(data.strike_price, data.currency);
  }

  const typeCounts = {
    ebook: 0 as number,
    physical: 0 as number,
  };

  data?.bundle_product?.map((the_book) => {
    if (the_book?.product?.is_physical === true) {
      typeCounts.physical += 1;
    } else if (the_book?.product?.is_physical === false) {
      typeCounts.ebook += 1;
    }
  });

  const bookType = (
    <div className="flex justify-start gap-1 absolute top-1 left-1 z-1 inline-flex">
      {typeCounts.ebook > 0 && (
        <span className="inline-flex gap-1 items-center px-1 py-[1px] text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-500 rounded-xs shadow-xs">
          {typeCounts.ebook} Ebook
        </span>
      )}
      {typeCounts.physical > 0 && (
        <span className="inline-flex gap-1 items-center px-1 py-[1px] text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-500 rounded-xs shadow-xs">
          {typeCounts.physical} Buku Cetak
        </span>
      )}
    </div>
  );

  return (
    <Link
      href={`/bundle/${data.slug}`}
      className="flex flex-col justify-start items-center gap-3 py-4 px-2 lg:px-4 relative cursor-pointer box-border w-full"
    >
      <div className="relative w-full h-auto overflow-visible">
        <ImgThumb
          src={data.cover}
          alt={data?.name}
          className="w-full h-auto aspect-3/4 object-cover object-center rounded-sm"
          width={320}
        />
        {bookType}
      </div>
      <h3 className="flex w-full text-[15px] text-left text-[#383D64] font-semibold leading-[1.3]">
        {data!.name}
      </h3>
      <span className="flex w-full text-left text-xs text-gray-400 -mt-2.5">
        {data?.author?.name}
      </span>
      <div className="flex flex-col justify-end items-start w-full text-nowrap">
        <DiscountPercent
          real_price={data?.real_price}
          strike_price={data?.strike_price}
        />
        <div
          className={`text-lg w-auto font-bold ${
            data.strike_price !== null &&
            data.strike_price !== "" &&
            data.strike_price > data.real_price
              ? "text-[#C6011B]"
              : "text-[#000]"
          }`}
        >
          {formatMoney(data.real_price, data.currency)}
        </div>
      </div>
    </Link>
  );
};
export default BundlingCard;
