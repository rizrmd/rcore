import { Link } from "@/lib/router";
import { MapPin, SquarePen } from "lucide-react";

export const CartAddress = ({ data = null as any }) => {
  return (
    <div className="flex w-full flex-col font-sm justify-start items-start gap-1.5">
      <div className="flex gap-2">
        <div className="flex flex-col items-center text-[#3B2C93] gap-1">
          <div className="flex items-center h-8 shrink-0">
            <MapPin size={20} />
          </div>
          <div className="w-0 grow-1 border border-dashed"></div>
        </div>
        <div className="flex flex-col gap-0">
          <h4 className="flex items-center h-8 font-semibold font-md">
            {data?.fullname}
          </h4>
          <div>{data?.phone}</div>
          <div>{data?.streets}</div>
          <div>
            {data?.city}, {data?.province} {data?.postal}
          </div>
          {data?.notes && (
            <div className="text-sm italic mt-2 text-gray-500">
              {data.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CartAddress;
