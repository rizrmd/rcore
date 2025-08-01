import { Link } from "@/lib/router";
import { CoverImage } from "../../ui/cover-image";

export const BookCardUpdated = ({ data }) => {
    const chapterList = data?.chapter || [];
    const chapterItems = chapterList.length > 0 && chapterList.map((chapter, index) => (
      <li key={`${data?.slug}_ch_${chapter?.number}_${index}`} className="text-xs text-gray-500">
        CH {chapter?.number}
      </li>
    ));
  return (
    <Link
      href={`/title/${data.slug}`}
      className="flex flex-col justify-start items-center gap-3 py-4 px-2 lg:px-4 relative cursor-pointer box-border w-full"
    >
      <div className="flex gap-3">
        <div className="relative w-1/3 h-auto overflow-visible">
          <CoverImage
            src={data.cover}
            title={data?.name || ""}
            author={data?.author?.name || ""}
            className="w-full h-auto aspect-3/4 rounded-sm"
            alt={data?.name}
          />
        </div>
        <div className="flex flex-col w-2/3 gap-3">
          <h3 className="w-full text-[15px] text-left text-[#383D64] font-semibold leading-[1.3]">
            {data!.name}
          </h3>
          <ul className="list-disc flex flex-col gap-0.5 w-full text-left text-xs text-gray-400 pl-4">
            {chapterItems}
          </ul>
        </div>
      </div> 
    </Link>
  );
};
