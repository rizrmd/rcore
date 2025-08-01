import { Link } from "@/lib/router";
import { formatMoney } from "../utils/format-money";
import { DiscountPercent } from "../ui/discount-percent";
import { ImgThumb } from "../ui/img-thumb";

export const BookCardAlt = ({ data }) => {
  return (
    <Link
      href={`/product/${data.slug}`}
      className="flex flex-col justify-start items-center gap-3 py-4 px-2 lg:px-4 relative cursor-pointer box-border w-full"
    >
      <div className="relative w-full h-auto overflow-visible">
        <ImgThumb src={data.cover} alt={data?.name} className="w-full h-auto aspect-3/4 object-cover object-center rounded-[4px]" width={320}/>
      </div>
      <h3 className="flex w-full text-[15px] text-left text-[#383D64] font-semibold leading-[1.3]">{data!.name}</h3>
      <div className="flex flex-col justify-start items-start w-full text-nowrap">
        <DiscountPercent real_price={data?.real_price} strike_price={data?.strike_price} currency={data?.currency}/>
        <div className={`w-auto font-bold text-lg ${data?.strike_price !== null && data?.strike_price !== "" && data?.strike_price > data?.real_price ? "text-[#C6011B]" : "text-black"}`}>
          {formatMoney(data.real_price, data.currency)}
        </div>
      </div>
    </Link>
  );
};
export default BookCardAlt;
