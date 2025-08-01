import { useState, useEffect } from "react";
import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { FilterSection } from "@/components/esensi/chapter/filter-section";
import { BooksGrid } from "@/components/esensi/chapter/books-grid";
import { PaginationSection } from "@/components/esensi/chapter/pagination-section";
import { Button } from "@/components/ui/button";
import { FilterIcon, SearchIcon } from "lucide-react";
import { api } from "@/lib/gen/chapter.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { Input } from "@/components/ui/input";
import { navigate } from "@/lib/router";

export default (data: Awaited<ReturnType<typeof api.search>>["data"]) => {
  // Check if data is still loading (navigation state)
  const isNavigating = !data || Object.keys(data).length === 0;

  // Use useState for currentPage to ensure proper updates
  const [currentPage, setCurrentPage] = useState(data?.page || 1);

  const local = useLocal({
    mobileFilterOpen: false,
    searchQuery: data?.search || "",
    selectedGenre: data?.selected_genre || "all",
    selectedTags: data?.selected_tags || [],
    minRating: data?.min_rating || 0,
    sortBy: data?.sort_by || "newest",
    loading: false,
  });

  // Update state when data changes (for client-side navigation)
  useEffect(() => {
    if (data && !isNavigating) {
      local.searchQuery = data.search || "";
      local.selectedGenre = data.selected_genre || "all";
      local.selectedTags = data.selected_tags || [];
      local.minRating = data.min_rating || 0;
      local.sortBy = data.sort_by || "newest";
      setCurrentPage(data.page || 1);
      local.render();
    }
  }, [data, isNavigating]);

  const books = data?.books || [];
  const genres = data?.genres || [];
  const tags = data?.tags || [];
  const totalPages = data?.pages || 1;
  const totalBooks = data?.total_books || 0;

  const handleSearch = async () => {
    if (!local.searchQuery.trim()) {
      return;
    }

    local.loading = true;
    local.render();

    const params = new URLSearchParams();
    if (local.selectedGenre !== "all") params.set("genre", local.selectedGenre);
    local.selectedTags.forEach((tag) => params.append("tags", tag));
    if (local.minRating > 0)
      params.set("minRating", local.minRating.toString());
    if (local.sortBy !== "newest") params.set("sortBy", local.sortBy);
    // Don't include page parameter - always reset to page 1 when applying filters

    const encodedQuery = encodeURIComponent(local.searchQuery.trim());
    navigate(
      `/search/${encodedQuery}${
        params.toString() ? "?" + params.toString() : ""
      }`
    );
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());

    const currentPath = window.location.pathname;
    navigate(`${currentPath}?${params.toString()}`);
  };

  const handleReset = () => {
    local.searchQuery = "";
    local.selectedGenre = "all";
    local.selectedTags = [];
    local.minRating = 0;
    local.sortBy = "newest";
    setCurrentPage(1);
    local.render();
    navigate("/browse"); // Redirect to browse instead of empty search
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <EsensiChapterLayout>
      <div className="w-full min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-(--esensi-color) -mx-4 px-4 py-8 mb-6">
          <div className="esensi-container mx-auto">
            <div className="flex items-center gap-4 mx-auto">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <SearchIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold mb-2">
                  {local.searchQuery ? (
                    <>
                      Hasil pencarian{" "}
                      <span className="text-(--esensi-color-alt)">
                        {local.searchQuery}
                      </span>
                    </>
                  ) : (
                    <>Hasil pencarian</>
                  )}
                </h1>
                <p className="text-white/90 text-base">
                  Temukan buku sesuai kata kunci pencarian dan gunakan filter
                  untuk hasil yang lebih spesifik
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
                {totalBooks} buku ditemukan
                {local.searchQuery && ` untuk "${local.searchQuery}"`}
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
              searchQuery={local.searchQuery}
              setSearchQuery={(value) => {
                local.searchQuery = value;
                local.render();
              }}
              selectedGenre={local.selectedGenre}
              setSelectedGenre={(value) => {
                local.selectedGenre = value;
                local.render();
              }}
              selectedTags={local.selectedTags}
              setSelectedTags={(value) => {
                local.selectedTags = value;
                local.render();
              }}
              minRating={local.minRating}
              setMinRating={(value) => {
                local.minRating = value;
                local.render();
              }}
              sortBy={local.sortBy}
              setSortBy={(value) => {
                local.sortBy = value;
                local.render();
              }}
              genres={genres}
              tags={tags}
              loading={local.loading || isNavigating}
              onSearch={handleSearch}
              onReset={handleReset}
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
                  {local.searchQuery ? (
                    <>
                      Menampilkan {books.length} dari {totalBooks} buku untuk "
                      {local.searchQuery}"
                      {local.selectedGenre !== "all" &&
                        (() => {
                          const genre = genres.find(
                            (g) => g.slug === local.selectedGenre
                          );
                          return genre ? ` dalam genre ${genre.name}` : "";
                        })()}
                      {local.selectedTags.length > 0 &&
                        (() => {
                          const selectedTagNames = local.selectedTags.map(
                            (tagSlug) => {
                              const tag = tags.find((t) => t.slug === tagSlug);
                              return tag ? tag.name : tagSlug;
                            }
                          );
                          return ` dengan tags: ${selectedTagNames.join(", ")}`;
                        })()}
                      {local.minRating > 0 &&
                        ` rating minimal ${local.minRating}.0`}
                    </>
                  ) : (
                    <>
                      {totalBooks > 0 ? (
                        <>
                          Menampilkan {books.length} dari {totalBooks} buku
                        </>
                      ) : (
                        <>Masukkan kata kunci pencarian untuk memulai</>
                      )}
                    </>
                  )}
                </p>
              </div>

              {/* No Results Message */}
              {local.searchQuery &&
                totalBooks === 0 &&
                !isNavigating &&
                !local.loading && (
                  <div className="text-center py-12">
                    <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tidak ada hasil ditemukan
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Pencarian untuk "{local.searchQuery}" tidak menghasilkan
                      hasil apapun.
                    </p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>Saran:</p>
                      <ul className="space-y-1">
                        <li>• Periksa ejaan kata kunci</li>
                        <li>• Coba gunakan kata kunci yang lebih umum</li>
                        <li>• Kurangi filter yang diterapkan</li>
                        <li>
                          • Jelajahi{" "}
                          <a
                            href="/browse"
                            className="text-blue-600 hover:underline"
                          >
                            koleksi lengkap
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

              {/* Books Grid */}
              {(totalBooks > 0 ||
                !local.searchQuery ||
                isNavigating ||
                local.loading) && (
                <BooksGrid
                  books={books}
                  loading={local.loading || isNavigating}
                />
              )}
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
