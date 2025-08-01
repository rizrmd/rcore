import { useState, useEffect } from "react";
import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { FilterSection } from "@/components/esensi/chapter/filter-section";
import { BooksGrid } from "@/components/esensi/chapter/books-grid";
import { PaginationSection } from "@/components/esensi/chapter/pagination-section";
import { Button } from "@/components/ui/button";
import { FilterIcon, TagIcon } from "lucide-react";
import { api } from "@/lib/gen/chapter.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";

export default (data: Awaited<ReturnType<typeof api.tag>>["data"]) => {
  const local = useLocal({ mobileFilterOpen: false });
  const [selectedGenre, setSelectedGenre] = useState(
    data?.selected_genre || "all"
  );
  const [minRating, setMinRating] = useState(data?.min_rating || 0);
  const [sortBy, setSortBy] = useState(data?.sort_by || "newest");
  const [currentPage, setCurrentPage] = useState(data?.page || 1);
  const [loading, setLoading] = useState(false);

  // Check if data is still loading (navigation state)
  const isNavigating = !data || Object.keys(data).length === 0;

  // Update state when data changes (for client-side navigation)
  useEffect(() => {
    if (data && !isNavigating) {
      setSelectedGenre(data.selected_genre || "all");
      setMinRating(data.min_rating || 0);
      setSortBy(data.sort_by || "newest");
      setCurrentPage(data.page || 1);
    }
  }, [data, isNavigating]);

  const books = data?.books || [];
  const genres = data?.genres || [];
  const totalPages = data?.pages || 1;
  const totalBooks = data?.total_books || 0;
  const tag = data?.tag;

  const handleSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedGenre !== "all") params.set("genre", selectedGenre);
    if (minRating > 0) params.set("minRating", minRating.toString());
    if (sortBy !== "newest") params.set("sortBy", sortBy);
    // Don't include page parameter - always reset to page 1 when applying filters

    const currentPath = window.location.pathname;
    navigate(
      `${currentPath}${params.toString() ? "?" + params.toString() : ""}`
    );
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());

    const currentPath = window.location.pathname;
    navigate(`${currentPath}?${params.toString()}`);
  };

  const handleReset = () => {
    setSelectedGenre("all");
    setMinRating(0);
    setSortBy("newest");
    setCurrentPage(1);

    const currentPath = window.location.pathname;
    navigate(currentPath);
  };

  // If tag not found, show error message (but not during navigation)
  if (!isNavigating && !tag) {
    return (
      <EsensiChapterLayout>
        <div className="w-full min-h-screen bg-gray-50">
          <div className="esensi-container mx-auto">
            <div className="pt-8 pb-6">
              <div className="text-center">
                <TagIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Tag Tidak Ditemukan
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                  Maaf, tag yang Anda cari tidak ditemukan atau telah dihapus.
                </p>
                <div className="space-x-4">
                  <Button onClick={() => navigate("/browse")} variant="default">
                    Jelajahi Semua Buku
                  </Button>
                  <Button onClick={() => navigate("/")} variant="outline">
                    Kembali ke Beranda
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EsensiChapterLayout>
    );
  }

  return (
    <EsensiChapterLayout>
      <div className="w-full min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-(--esensi-color) -mx-4 px-4 py-8 mb-6">
          <div className="esensi-container mx-auto">
            <div className="flex items-center gap-4 mx-auto">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <TagIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold mb-2">
                  {tag?.name ? (
                    <>
                      Semua bacaan dengan tag{" "}
                      <span className="text-(--esensi-color-alt)">
                        {tag.name}
                      </span>
                    </>
                  ) : (
                    <>Koleksi bacaan dengan tag paling diminati</>
                  )}
                </h1>
                <p className="text-white/90 text-base">
                  {tag?.name
                    ? `Jelajahi semua cerita dengan tag ${tag.name} dan temukan yang sesuai dengan selera bacamu`
                    : "Temukan koleksi buku dengan tag pilihan dan sesuaikan dengan selera bacamu"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="esensi-container mx-auto">
          {/* Mobile Filter Bar */}
          <div className="lg:hidden sticky top-0 z-20 bg-white border-b -mx-4">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {totalBooks} buku dengan tag "{tag.name}"
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  local.mobileFilterOpen = true;
                  local.render();
                }}
                className="flex items-center gap-2"
              >
                <FilterIcon className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 pt-6">
            {/* Filter Section */}
            <FilterSection
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              selectedTags={[]}
              setSelectedTags={() => {}}
              minRating={minRating}
              setMinRating={setMinRating}
              sortBy={sortBy}
              setSortBy={setSortBy}
              genres={genres}
              tags={[]}
              loading={loading || isNavigating}
              onSearch={handleSearch}
              onReset={handleReset}
              hideGenreFilter={true}
              hideTags={true}
              mobileFilterOpen={local.mobileFilterOpen}
              setMobileFilterOpen={(value) => {
                local.mobileFilterOpen = value;
                local.render();
              }}
            />

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Info */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Menampilkan {books.length} dari {totalBooks} buku dengan tag "
                  {tag.name}"
                  {selectedGenre !== "all" &&
                    (() => {
                      const genre = genres.find(
                        (g) => g.slug === selectedGenre
                      );
                      return genre ? ` dalam genre ${genre.name}` : "";
                    })()}
                  {minRating > 0 && ` rating minimal ${minRating}.0`}
                </p>
              </div>

              {/* Books Grid */}
              <BooksGrid books={books} loading={loading || isNavigating} />
            </div>
          </div>

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
    </EsensiChapterLayout>
  );
};
