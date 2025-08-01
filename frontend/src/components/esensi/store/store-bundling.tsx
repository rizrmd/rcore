import { Link } from "@/lib/router";
import { StoreBundlingCard } from "./store-bundling-card";
import { ImgThumb } from "../ui/img-thumb";

export const StoreBundling = ({ slug, img, list }) => {

  const renderBooks = list.map((book, idx) => {
    return (
      <StoreBundlingCard data={book?.product} key={`esensi_store_bundlinglist_${idx}`} />
    );
  });

  return (
    <div className="flex flex-row w-full lg:px-6 gap-5 justify-center items-stretch">
      <div className="flex w-auto lg:w-1/4 flex-row shrink-0">
        <Link href={`/bundle/${slug}`}>
            <ImgThumb src={img} width={320} alt="Special bundle" className="w-stretch h-auto aspect-1/1 object-fill position-center rounded-sm"/>
        </Link>
      </div>

      <div className="hidden lg:flex h-auto relative w-1 border-r border-dashed border-[#ccc]"></div>

      <div className="hidden lg:flex flex-nowrap w-auto grow-0 flex-row relative overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-auto gap-4 [&>a]:w-[auto]">{renderBooks}</div>
      </div>
    </div>
  );
};
export default StoreBundling;
