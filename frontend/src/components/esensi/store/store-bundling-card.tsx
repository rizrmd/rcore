import { Link } from "@/lib/router";
import { formatMoney } from "../utils/format-money";
import { Star } from "lucide-react";
import { ImgThumb } from "../ui/img-thumb";

export const StoreBundlingCard = ({ data }) => {
  const stars = Array.from({ length: 5 }, (_, idx) => {
    return <Star size={13} fill="currentColor" strokeWidth={0} key={`esensi_rating_${idx}`} />;
  });
  return (
    <Link
      href={`/product/${data.slug}`}
      className="flex h-full w-auto relative"
    >
      <div className="flex w-auto h-full aspect-3/4 relative">
        <ImgThumb src={data.cover} alt={data?.name} className="h-full aspect-3/4 w-auto object-cover object-center relative rounded-[4px]" width={320}/>
      </div>
      <div className="flex flex-col justify-center items-start min-w-[175px] py-10 px-6 text-left text-[#383D64] gap-2">
        <div className="flex flex-col justify-start items-start grow-1">
          <span className="text-xs">Author</span>
          <h3 className="font-bold leading-[1.2]">{data.name}</h3>
        </div>
        <div className="flex items-center text-[#FFC540] mt-2">
          {stars} <span className="text-[#383D64] ml-2 text-[13px]">5</span>
        </div>
        <div className="text-xl text-[#E3330A] font-bold whitespace-pre">
          {formatMoney(data.real_price, data.currency)}
        </div>
      </div>
    </Link>
  );
};
export default StoreBundlingCard;
