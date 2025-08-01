import { Link } from "@/lib/router";
import { formatMoney } from "../utils/format-money";
import { DiscountPercent } from "../ui/discount-percent";
import { ImgThumb } from "../ui/img-thumb";

export const BundleListItem = ({ data }) => {

  const price = data?.strike_price !== null && data.strike_price > 0 ? data.strike_price : data.real_price;

  return (
    <Link
      href={`/product/${data.slug}`}
      className="flex justify-start gap-3 py-4 px-2 lg:px-4 relative cursor-pointer box-border w-auto"
    >
      <div className="relative w-30 h-auto overflow-visible">
        <ImgThumb
          src={data.cover}
          alt={data?.name}
          className="w-full h-auto aspect-3/4 object-cover object-center rounded-[4px]"
          width={150}
        />
      </div>
      <div className="flex flex-col max-w-40 gap-2">
        <h3 className="flex grow-1 text-sm text-left text-[#383D64] font-semibold leading-[1.3]">
          {data!.name}
        </h3>
        <div className="flex flex-col justify-start items-start w-full text-nowrap">
          <div
            className={`w-auto font-bold text-sm text-black`}
          >
            {formatMoney(price, data.currency)}
          </div>
        </div>
      </div>
    </Link>
  );
};
export default BundleListItem;
