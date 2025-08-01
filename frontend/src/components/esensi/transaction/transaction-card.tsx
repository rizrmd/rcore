import { Link } from "@/lib/router";
import { ImgThumb } from "../ui/img-thumb";

interface TransactionCardProps {
  data: {
    id: string;
    order_id: string;
    title: string;
    thumbnail: string;
    status: string;
    status_label: string;
    total_amount: number;
    currency: string;
    purchase_date: string;
    purchase_time: string;
    formatted_price: string;
    items: Array<{
      name: string;
      thumbnail: string;
      quantity: number;
      price: number;
      type: "product" | "bundle";
    }>;
  };
}

export const TransactionCard = ({ data }: TransactionCardProps) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-[#3B2C93] text-white";
      case "pending":
        return "bg-[#f39c12] text-white";
      case "canceled":
        return "bg-[#E74C3C] text-white";
      case "expired":
        return "bg-[#7f8c8d] text-white";
      case "fraud":
      case "failed":
        return "bg-[#e84118] text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Link
      href={`/trx/${data.id}`}
      className="flex flex-col gap-3 bg-white rounded-sm border border-gray-100 hover:shadow-sm"
    >
      {/* Header with date and status */}
      <div className="flex justify-between items-center border-b border-[#F7F8FA] py-2 px-4">
        <div className="text-xs text-gray-500">
          {data.purchase_date}, pukul {data.purchase_time}
        </div>
        <div
          className={`px-3 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(
            data.status
          )}`}
        >
          {data.status_label}
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-4 px-4">
        {/* Book thumbnail */}
        <div className="flex-shrink-0">
          <ImgThumb
            src={data.thumbnail}
            alt={data.title}
            width={75}
            className="rounded-sm"
          />
        </div>

        {/* Book details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-2">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-[#3B2C93] text-base leading-tight">
              {data.title}
            </h3>
            {/* Original price (strikethrough) */}
            <div className="text-sm text-gray-400">{data.formatted_price}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end px-4 py-2 border-t border-[#F7F8FA]">
        {/* Multiple items indicator */}
        {data.items.length > 1 && (
            <div className="grow-1 text-xs text-gray-500">
              +{data.items.length - 1} item lainnya dalam pesanan ini
            </div>
        )}
        {/* Final price with arrow */}
        <div className="gap-1.5 shrink-0 text-md flex items-center justify-end">
          <span className="font-medium text-gray-500">Total</span>
          <span className="font-bold text-[#3B2C93]">{data.formatted_price}</span>
        </div>
      </div>
    </Link>
  );
};
export default TransactionCard;
