import { BookCard } from "@/components/esensi/chapter/book/book-card";
import { SearchIcon } from "lucide-react";

interface Book {
  id: string;
  title: string;
  [key: string]: any;
}

interface BooksGridProps {
  books: Book[];
  loading?: boolean;
}

export function BooksGrid({ books, loading }: BooksGridProps) {
  if (loading) {
    return (
      <div className="pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg aspect-[3/4]"></div>
              <div className="mt-2 h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="mt-1 h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="pb-8">
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <SearchIcon className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada buku ditemukan
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Coba ubah filter pencarian atau kata kunci untuk menemukan buku yang Anda cari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {books.map((book) => (
          <BookCard key={book.id} data={book} />
        ))}
      </div>
    </div>
  );
}