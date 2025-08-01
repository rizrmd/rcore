import { useState, useEffect } from "react";
import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { BookCard } from "@/components/esensi/chapter/book/book-card";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TagsInput } from "@/components/ui/tags-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, FilterIcon, Star } from "lucide-react";
import { api } from "@/lib/gen/chapter.esensi";

export default (data: Awaited<ReturnType<typeof api.browse>>["data"]) => {
  const [searchQuery, setSearchQuery] = useState(data?.search || "");
  const [selectedGenre, setSelectedGenre] = useState(data?.selected_genre || "all");
  const [selectedCategory, setSelectedCategory] = useState(data?.selected_category || "all");
  const [selectedTags, setSelectedTags] = useState<string[]>(data?.selected_tags || []);
  const [minRating, setMinRating] = useState(data?.min_rating || 0);
  const [sortBy, setSortBy] = useState(data?.sort_by || "newest");
  const [currentPage, setCurrentPage] = useState(data?.page || 1);
  const [loading, setLoading] = useState(false);

  const books = data?.books || [];
  const genres = data?.genres || [];
  const categories = data?.categories || [];
  const tags = data?.tags || [];
  const totalPages = data?.pages || 1;
  const totalBooks = data?.total_books || 0;

  const handleSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGenre !== 'all') params.set('genre', selectedGenre);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    selectedTags.forEach(tag => params.append('tags', tag));
    if (minRating > 0) params.set('minRating', minRating.toString());
    if (sortBy !== 'newest') params.set('sortBy', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    window.location.href = `/browse${params.toString() ? '?' + params.toString() : ''}`;
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    
    window.location.href = `/browse?${params.toString()}`;
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedGenre("all");
    setSelectedCategory("all");
    setSelectedTags([]);
    setMinRating(0);
    setSortBy("newest");
    window.location.href = '/browse';
  };

  return (
    <EsensiChapterLayout>
      <div className="w-full min-h-screen bg-gray-50">
        <div className="esensi-container mx-auto">
          {/* Page Header */}
          <div className="pt-8 pb-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Jelajahi Koleksi Buku
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Temukan buku favorit Anda dari berbagai genre dan kategori. Gunakan filter untuk mempersempit pencarian sesuai preferensi Anda.
              </p>
            </div>
          </div>
          
        <div className="flex flex-col lg:flex-row gap-6 pt-6">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Pencarian</h3>
              
              <div className="space-y-4">
                {/* Search Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cari Buku
                  </label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Judul buku atau penulis..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Genre Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "all", label: "Semua Genre" },
                      ...genres.map((genre) => ({
                        value: genre.slug,
                        label: genre.name
                      }))
                    ]}
                    value={selectedGenre}
                    onValueChange={setSelectedGenre}
                    placeholder="Pilih Genre"
                    searchPlaceholder="Cari genre..."
                    emptyText="Genre tidak ditemukan."
                    className="w-full"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "all", label: "Semua Kategori" },
                      ...categories.map((category) => ({
                        value: category.slug,
                        label: category.name
                      }))
                    ]}
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    placeholder="Pilih Kategori"
                    searchPlaceholder="Cari kategori..."
                    emptyText="Kategori tidak ditemukan."
                    className="w-full"
                  />
                </div>

                {/* Tags Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <TagsInput
                    tags={tags.map((tag) => ({
                      value: tag.slug,
                      label: tag.name
                    }))}
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    placeholder="Pilih tags..."
                    searchPlaceholder="Cari tags..."
                    emptyText="Tag tidak ditemukan."
                    className="w-full"
                  />
                </div>

                {/* Minimum Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating Minimal
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              rating <= minRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {minRating > 0 && (
                      <span className="text-sm text-gray-600">
                        {minRating}.0+
                      </span>
                    )}
                  </div>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urutkan
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Terbaru</SelectItem>
                      <SelectItem value="oldest">Terlama</SelectItem>
                      <SelectItem value="title">Judul A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4">
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-(--esensi-color) text-(--esensi-color-i) hover:bg-(--esensi-color-alt)"
                  >
                    {loading ? "Mencari..." : "Apply Filter"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="w-full"
                  >
                    Reset Filter
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Info */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Menampilkan {books.length} dari {totalBooks} buku
                {searchQuery && ` untuk "${searchQuery}"`}
                {selectedGenre !== "all" && (() => {
                  const genre = genres.find(g => g.slug === selectedGenre);
                  return genre ? ` dalam genre ${genre.name}` : '';
                })()}
                {selectedCategory !== "all" && (() => {
                  const category = categories.find(c => c.slug === selectedCategory);
                  return category ? ` kategori ${category.name}` : '';
                })()}
                {selectedTags.length > 0 && (() => {
                  const selectedTagNames = selectedTags.map(tagSlug => {
                    const tag = tags.find(t => t.slug === tagSlug);
                    return tag ? tag.name : tagSlug;
                  });
                  return ` dengan tags: ${selectedTagNames.join(", ")}`;
                })()}
                {minRating > 0 && ` rating minimal ${minRating}.0`}
              </p>
            </div>

            {/* Books Grid */}
            <div className="pb-8">
              {books.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  {books.map((book) => (
                    <BookCard key={book.id} data={book} />
                  ))}
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border-t -mx-4 lg:mx-0 lg:rounded-lg lg:mt-6">
            <div className="px-4 lg:px-8 py-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
      </div>
    </EsensiChapterLayout>
  );
};