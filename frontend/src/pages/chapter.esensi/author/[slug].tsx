import { useState, useEffect } from "react";
import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { BooksGrid } from "@/components/esensi/chapter/books-grid";
import { PaginationSection } from "@/components/esensi/chapter/pagination-section";
import { Button } from "@/components/ui/button";
import { BookOpenIcon, CheckCircle } from "lucide-react";
import { api } from "@/lib/gen/chapter.esensi";
import { navigate } from "@/lib/router";
import { CoverImage } from "@/components/esensi/ui/cover-image";

export default (data: Awaited<ReturnType<typeof api.author_profile>>["data"]) => {
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;

  // Check if data is still loading (navigation state)
  const isNavigating = !data || Object.keys(data).length === 0;

  const author = data;
  const books = author?.book || [];
  const totalBooks = author?._count?.book || 0;
  const totalPages = Math.ceil(books.length / booksPerPage);

  // Paginate books
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const currentBooks = books.slice(startIndex, endIndex);

  // If author not found, show error message (but not during navigation)
  if (!isNavigating && !author) {
    return (
      <EsensiChapterLayout>
        <div className="w-full min-h-screen bg-gray-50">
          <div className="esensi-container mx-auto">
            <div className="pt-8 pb-6">
              <div className="text-center">
                <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Penulis Tidak Ditemukan
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                  Maaf, penulis yang Anda cari tidak ditemukan atau telah dihapus.
                </p>
                <div className="space-x-4">
                  <Button onClick={() => navigate("/browse")} variant="default">
                    Jelajahi Semua Buku
                  </Button>
                  <Button onClick={() => navigate("/search")} variant="outline">
                    Cari Buku
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EsensiChapterLayout>
    );
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of books section
    const booksSection = document.getElementById("books-section");
    if (booksSection) {
      booksSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <EsensiChapterLayout>
      <div className="w-full min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-(--esensi-color) -mx-4 px-4 py-8 mb-6">
          <div className="esensi-container mx-auto">
            <div className="flex flex-col items-center text-center">
              {/* Profile Image */}
              <div className="mb-4">
                {author?.avatar ? (
                  <img
                    src={author.avatar}
                    alt={author.name || "Penulis"}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-4xl font-bold text-white">
                      {author?.name?.charAt(0)?.toUpperCase() || "P"}
                    </span>
                  </div>
                )}
              </div>

              {/* Author Name with Checkmark */}
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {author?.name || "Penulis"}
                </h1>
                {author?.auth_user?.email_verified && (
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                )}
              </div>

              {/* Number of Books */}
              <p className="text-lg text-white/90">
                {totalBooks} {totalBooks === 1 ? "Buku" : "Buku"} Diterbitkan
              </p>

              {/* Biography */}
              {author?.biography && (
                <p className="mt-4 text-white/80 max-w-2xl">
                  {author.biography}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="esensi-container mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Empty as requested */}
            <aside className="lg:w-64 flex-shrink-0">
              {/* Empty sidebar */}
            </aside>

            {/* Main Content */}
            <div className="flex-1" id="books-section">
              {/* Section Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Daftar Buku
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Menampilkan {currentBooks.length} dari {books.length} buku
                </p>
              </div>

              {/* Books Grid */}
              <BooksGrid 
                books={currentBooks.map(book => ({
                  id: book.id,
                  slug: book.slug,
                  name: book.name || "",
                  cover: book.product?.[0]?.cover_url || book.cover_url || "",
                  book_genre: book.book_genre || [],
                  author: {
                    id: author.id,
                    name: author.name || "",
                    slug: author.slug || ""
                  }
                }))} 
                loading={isNavigating} 
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <PaginationSection
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </EsensiChapterLayout>
  );
};