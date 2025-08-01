import { MoveRight } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { ImgThumb } from "../ui/img-thumb";

export const StoreHeaderBanner = ({
  img,
  title,
  subtitle,
  btnlabel,
  btnurl = "#",
  btnnewtab = false,
}) => {
  const bannerImage = img && img !== "" ? img : "";
  return (
    <div className="w-full h-auto relative">
      <Link
        href={btnurl}
        className="w-full h-auto aspect-video flex flex-col lg:hidden"
        target={btnnewtab ? "_blank" : "_self"}
      >
        <ImgThumb
          src={bannerImage}
          skipResize={true}
          className="absolute top-0 left-0 w-full h-full object-cover object-center"
        />
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-end items-start gap-2 py-8 px-6 text-white">
          <h3 className="text-2xl font-medium max-w-[50%]">{title}</h3>
          <p className="text-lg">{subtitle}</p>
        </div>
      </Link>

      <div className="w-full h-auto aspect-3/1 hidden lg:flex lg:flex-col">
        <ImgThumb
          src={bannerImage}
          skipResize={true}
          className="absolute top-0 left-0 w-full h-full object-cover object-center"
        />
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-end gap-6 py-15 px-25 text-white">
          <div className="flex relative w-full max-w-[1200px] px-6">
            <div className="flex w-auto items-start flex-col gap-4">
              <h3 className="text-5xl font-semibold leading-[1.5]">{title}</h3>
              <p className="text-2xl">{subtitle}</p>
              <Button variant="outline" asChild>
                <Link
                  href={btnurl}
                  className="flex text-xl justify-center items-center gap-4 px-14 w-auto h-auto text-white bg-transparent border-1 border-white"
                >
                  <span>{btnlabel}</span>
                  <MoveRight size={32} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StoreHeaderBanner;
