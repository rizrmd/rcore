import { Frown } from "lucide-react";
import { BookCardAlt } from "../book/book-card-alt";
import { BookCardLoading } from "../book/book-card-loading";
import { SectionTitle } from "./section-title";

export const RelatedPost = ({
  data = [] as any,
  loading = false as boolean,
  title = "Rekomendasi Untukmu" as string,
  currentId = null as string | number | null,
}) => {
  // Filter out current book/bundle if currentId is provided
  const filteredData = currentId 
    ? data.filter((book) => book.id !== currentId && book.slug !== currentId)
    : data;

  const retreiveBooks = filteredData.map((book, idx) => {
    return <BookCardAlt data={book} key={`related_books_${idx}`} />;
  });

  const noBooks = (
    <div className="flex flex-col justify-center items-center gap-4 w-full h-auto py-10 px-4 relative">
      <Frown size={48} />
      <strong className="text-[#383D64] text-center text-2xl font-semibold">
        Tidak ada buku yang ditemukan
      </strong>
      <div className="text-[#383D64] text-center text-sm font-normal">
        Coba cari kategori yang lain
      </div>
    </div>
  );

  const renderBooks = filteredData.length > 0 ? retreiveBooks : noBooks;

  const renderLoading = Array.from({ length: 8 }, (_, idx) => {
    return <BookCardLoading key={`store_books_loading_${idx}`} />;
  });

  const renderPost = (
    <div className="w-full flex justify-center">
      <div className="w-full flex flex-col justify-center gap-3 max-w-[1200px] lg:pb-8">
        <h3 className="flex lg:hidden font-bold text-[#3B2C93] px-6 text-lg">
          {title}
        </h3>
        <SectionTitle title={title} className="hidden lg:flex" />
        <div className="flex w-full overflow-x-auto px-4">
          <div className="flex flex-row justify-start items-stretch gap-y-4 w-auto [&>a,&>.esensi-book-loading]:w-[165px] lg:[&>a,&>.esensi-book-loading]:w-[200px] [&>div:not(.esensi-book-loading)]:mx-4">
            {loading ? renderLoading : renderBooks}
          </div>
        </div>
      </div>
    </div>
  );

  return <>{renderPost}</>;
};

export default RelatedPost;
