import { Link } from "@/lib/router";
import { ChevronRight, Frown } from "lucide-react";
import { BookCardAlt } from "./book-card-alt";
import { BookCardLoading } from "./book-card-loading";

export type BooksCardItem = {
  name: string;
  real_price: BigInt;
  strike_price: BigInt;
  currency: string;
  cover: string;
  slug: string;
};

export type BooksCategories = {
  name: string;
  slug: string;
};

export const BooksByCategory = async ({
  action,
  loading,
  categories,
  selected,
  list,
}) => {
  const retreiveBooks = list.map((book, idx) => {
    return <BookCardAlt data={book} key={`store_books_${idx}`} />;
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
  const renderBooks = list.length > 0 ? retreiveBooks : noBooks;

  const renderBooksLoading = Array.from({ length: 8 }, (_, idx) => {
    return <BookCardLoading key={`store_books_loading_${idx}`} />;
  });

  const tabs = categories.map((cat, idx) => {
    return (
      <Link
        key={`books_by_category_tab_${idx}`}
        href={`/category/${cat.slug}`}
        onClick={(e) => {
          e.preventDefault();
          if (selected !== cat.slug) {
            action(cat.slug);
          }
        }}
        className={`flex items-center justify-center px-5 w-auto h-8 rounded-[6px] cursor-pointer font-medium ${
          selected === cat.slug ? "bg-white text-[#3b2c93]" : "text-white"
        }`}
      >
        {cat.name}
      </Link>
    );
  });

  return (
    <div className="w-full flex lg:hidden flex-col justify-center gap-2 md:gap-20 lg:px-16 lg:pb-8">
      <div className="w-full flex justify-between items-center gap-4 px-6 text-[#1a2bc3]">
        <span className="text-lg font-semibold">Berdasarkan Genre</span>
        <ChevronRight size={28} />
      </div>
      <div className="w-full flex px-6">
        <div className="flex w-full overflow-x-auto bg-[#3b2c93] whitespace-nowrap rounded-[10px]">
          <div className="w-auto flex justify-start items-center gap-2 p-[6px]">
            {tabs}
          </div>
        </div>
      </div>
      <div className="flex w-full overflow-x-auto px-4">
        <div className="flex flex-row justify-start items-stretch gap-y-4 w-auto [&>a,&>.esensi-book-loading]:w-[165px] [&>div:not(.esensi-book-loading)]:mx-4">
          {loading ? renderBooksLoading : renderBooks}
        </div>
      </div>
    </div>
  );
};
export default BooksByCategory;
