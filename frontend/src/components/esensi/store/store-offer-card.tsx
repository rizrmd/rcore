import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ImgThumb } from "../ui/img-thumb";

export const StoreOfferCard = ({ title, subtitle, description, url, img }) => {
  return (
    <div className="flex flex-col w-full h-full justify-start items-stretch px-4">
      <div className="bg-[#3B2C93] rounded-[5px] relative overflow-hidden">
        <div className="flex flex-col justify-between bg-transparent h-1/3 text-white p-6">
          <div className="flex flex-col w-full">
            <span>{subtitle}</span>
            <h3 className="text-3xl font-semibold">{title}</h3>
          </div>
          <div className="flex justify-between w-full items-center justify-between">
            <p>{description}</p>
            <Button variant="ghost" asChild>
              <Link
                href={url}
                className="flex gap-2 items-center rounded-full text-[#3B2C93] bg-white "
              >
                <span>See more</span>
                <ArrowRight size={32} />
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex items-stretch h-2/3">
        <ImgThumb src={img} alt={title} className="w-full h-full object-fill position-center"/>
        </div>
      </div>
    </div>
  );
};
export default StoreOfferCard;
