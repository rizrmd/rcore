import { Link } from "@/lib/router";
import { CoverImage } from "../../ui/cover-image";
import { Eye, NotebookText, ThumbsUp } from "lucide-react";

export const BookCard = ({ data }) => {

  const numberFormatter = (the_number) => {
    if (the_number >= 1000000000) {
      return (the_number / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
    } else if (the_number >= 1000000) {
      return (the_number / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    } else if (the_number >= 1000) {
      return (the_number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return the_number.toString();
  }

  return (
    <div className="flex flex-col justify-start items-center gap-1.5 py-4 px-2 lg:px-4 relative box-border w-full">
      <Link href={`/title/${data.slug}`} className="w-full flex flex-col justify-start items-center gap-2 cursor-pointer">
        <div className="relative w-full h-auto overflow-visible">
          <CoverImage
            src={data.cover}
            title={data?.name || ""}
            author={data?.author?.name || ""}
            className="w-full h-auto aspect-3/4 rounded-sm"
            alt={data?.name}
          />
        </div>

        <h3 className="w-full text-[15px] text-left text-[#383D64] font-semibold leading-[1.3]">
          {data!.name}
        </h3>
      </Link>
      <Link 
        href={`/author/${data?.author?.slug}`}
        className="flex w-full text-left font-semibold text-gray-700 text-xs -mt-1"
        onClick={(e) => e.stopPropagation()}
      >
        {data?.author?.name}
      </Link>
      <div className="w-full flex gap-4 md:gap-6 justify-between items-center text-xs text-gray-400 [&>span]:flex [&>span]:items-center [&>span]:gap-1">
        <span title={`${data?.story_views || 0} views`}><Eye size={"1.25em"}/> {numberFormatter(data?.story_views || 0)}</span>
        <span title={`${data?._count?.book_likes || 0} likes`}><ThumbsUp size={"1.25em"}/> {numberFormatter(data?._count?.book_likes || 0)}</span>
        <span title={`${data?._count?.chapter || 0} chapters`}><NotebookText size={"1.25em"}/> {numberFormatter(data?._count?.chapter || 0)}</span> 
      </div>
      
      {data?.book_genre && data.book_genre.length > 0 && (
        <div className="flex flex-wrap gap-1 w-full mt-2 text-[.6rem] text-gray-500 [&_span]:bg-gray-100 [&_span]:px-1.5 [&_span]:py-0.5 [&_span]:rounded-full">
          {data.book_genre.map((thegen, idx) => (
            <span key={`esensi-genre-${idx}`}>{thegen?.genre?.name}</span>
          ))}
        </div>
      )}
    </div>
  );
};
