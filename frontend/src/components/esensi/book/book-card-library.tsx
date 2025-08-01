import { Link } from "@/lib/router";
import type CSS from "csstype";
import { Button } from "@/components/ui/button";
import { ImgThumb } from "../ui/img-thumb";

const formatLastRead = (lastRead: string | null): string => {
  if (!lastRead) return "Belum Dibaca";

  const now = new Date();
  const readDate = new Date(lastRead);
  const diffMs = now.getTime() - readDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `Dibaca: ${diffDays} hari yg lalu`;
  } else if (diffHours > 0) {
    return `Dibaca: ${diffHours} jam yg lalu`;
  } else if (diffMinutes > 0) {
    return `Dibaca: ${diffMinutes} menit yg lalu`;
  } else {
    return "Dibaca: Baru saja";
  }
};

export const BookCardLibrary = ({ data }) => {
  const renderAuthor = (info: any, directAuthor?: string) => {
    // First try to get author from info array
    if (info?.length > 0) {
      const author = info.find((i: any) => i[0].toLowerCase() === "penulis");
      if (author && author[1] && author[1] !== "Unknown Author") {
        return <div className="text-sm text-[#B0B0B0]">{author[1]}</div>;
      }
    }

    return <div className="text-sm text-[#B0B0B0]">{directAuthor}</div>;
  };

  const category_list =
    data?.category &&
    data?.category.length > 0 &&
    data?.category.map((cat, idx) => {
      return (
        <Link
          key={`esensi_library__${data?.slug}_cat_${idx}`}
          href={`/category/${cat.slug}`}
          className="flex py-1 px-2 rounded-full text-xs cursor-pointer text-[#383D64] bg-[#E1E5EF] hover:lg:bg-[#383D64] hover:lg:text-[#E1E5EF] transition-colors"
        >
          {cat.name}
        </Link>
      );
    });

  const renderCategories = category_list && (
    <div className="flex flex-wrap gap-1">{category_list}</div>
  );

  return (
    <div className="flex w-full h-auto items-stretch gap-4">
      <div className="flex justify-start items-start w-1/3 lg:w-[150px] h-auto">
        <ImgThumb
          src={data?.cover}
          alt={data?.name}
          className="w-full grow-0 bg-black h-auto object-cover object-center rounded-[4px]"
          width={320}
        />
      </div>
      <div className="flex flex-col w-full h-full justify-between gap-2">
        <div className="flex justify-between items-start">
          <h3 className="flex text-left text-[#3B2C93] text-sm font-semibold leading-[1.3] grow-1">
            {data.name}
          </h3>
          {data?.percent == 0 && (
            <div className="bg-[#C6011B] text-white leading-[2] text-xs px-2 rounded-full shrink-0">
              Baru!
            </div>
          )}
        </div>
        <div className="flex flex-col grow-1 items-start justify-start">
          {renderAuthor(data?.info, data?.author)}
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-gray-500 italic">
              {formatLastRead(data?.last_read)}
            </div>
            {data?.last_read && (
              <div className="text-xs text-[#3B2C93] font-medium">
                {data.percent}% selesai
              </div>
            )}
          </div>
          {renderCategories}
        </div>
        <div className="flex w-full flex-col items-center">
          <Button asChild className="rounded-md bg-[#3B2C93]">
            <Link
              href="#"
              className="flex w-full justify-center items-center text-md rounded-full"
            >
              {data.percent == 0
                ? "Mulai baca"
                : data.percent == 100
                ? "Baca lagi"
                : "Lanjut baca"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default BookCardLibrary;
