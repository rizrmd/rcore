import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useLocal } from "@/lib/hooks/use-local";

interface FilterSectionProps {
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  selectedGenre?: string;
  setSelectedGenre?: (value: string) => void;
  selectedTags?: string[];
  setSelectedTags?: (value: string[]) => void;
  minRating: number;
  setMinRating: (value: number) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  genres?: Array<{ slug: string; name: string }>;
  tags?: Array<{ slug: string; name: string }>;
  loading: boolean;
  onSearch: () => void;
  onReset: () => void;
  genreInfo?: { slug: string; name: string };
  hideGenreFilter?: boolean;
  hideGenreInfo?: boolean;
  hideSearch?: boolean;
  hideTags?: boolean;
  mobileFilterOpen?: boolean;
  setMobileFilterOpen?: (value: boolean) => void;
}

const FilterContent = ({
  searchQuery,
  setSearchQuery,
  selectedGenre,
  setSelectedGenre,
  selectedTags,
  setSelectedTags,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  genres,
  tags,
  loading,
  onSearch,
  onReset,
  genreInfo,
  hideGenreFilter,
  hideGenreInfo,
  hideSearch,
  hideTags,
}: FilterSectionProps) => (
  <div className="space-y-4">

    {/* Search Input */}
    {!hideSearch && setSearchQuery && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pencarian
        </label>
        <input
          type="text"
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
          placeholder="Cari judul, penulis, genre, atau tag..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading}
        />
      </div>
    )}

    {/* Sort Filter */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Urutkan
      </label>
      <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
        <SelectTrigger className="w-full shadow-none">
          <SelectValue placeholder="Urutkan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Terbaru</SelectItem>
          <SelectItem value="oldest">Terlama</SelectItem>
          <SelectItem value="rating_highest">Rating tertinggi</SelectItem>
          <SelectItem value="rating_lowest">Rating terendah</SelectItem>
          <SelectItem value="title_asc">Judul A-Z</SelectItem>
          <SelectItem value="title_desc">Judul Z-A</SelectItem>
          <SelectItem value="chapters_most">Chapters terbanyak</SelectItem>
          <SelectItem value="chapters_least">Chapters terdikit</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Genre Filter or Current Genre Info */}
    {!hideGenreFilter && genres && setSelectedGenre && selectedGenre !== undefined ? (
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
          onValueChange={(value) => !hideGenreFilter && !loading && setSelectedGenre && setSelectedGenre(value)}
          placeholder="Pilih Genre"
          searchPlaceholder="Cari genre..."
          emptyText="Genre tidak ditemukan."
          className="w-full shadow-none"
        />
      </div>
    ) : genreInfo && !hideGenreInfo ? (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Genre Aktif
        </label>
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-md">
          <span className="font-semibold text-primary">{genreInfo.name}</span>
          <a
            href="/browse"
            className="text-sm text-gray-600 hover:text-primary transition-colors"
          >
            Ubah Genre
          </a>
        </div>
      </div>
    ) : null}

    {/* Tags Filter */}
    {!hideTags && tags && tags.length > 0 && setSelectedTags && selectedTags ? (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.slug);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => {
                  if (!hideTags && setSelectedTags) {
                    const newTags = isSelected
                      ? selectedTags.filter(t => t !== tag.slug)
                      : [...selectedTags, tag.slug];
                    setSelectedTags(newTags);
                  }
                }}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
                disabled={hideTags || loading}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>
    ) : null}

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
              onClick={() => !loading && setMinRating(minRating === rating ? 0 : rating)}
              className="p-1 hover:scale-110 transition-transform"
              disabled={loading}
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

    {/* Action Buttons */}
    <div className="space-y-2 pt-4">
      <Button
        onClick={onSearch}
        disabled={loading}
        className="w-full bg-(--esensi-color) text-(--esensi-color-i) hover:bg-(--esensi-color-alt)"
      >
        {loading ? "Mencari..." : "Apply Filter"}
      </Button>
      
      <Button
        variant="outline"
        onClick={onReset}
        className="w-full"
      >
        Reset Filter
      </Button>
    </div>
  </div>
);

interface FilterSectionComponentProps extends FilterSectionProps {
  mobileFilterOpen: boolean;
  setMobileFilterOpen: (value: boolean) => void;
}

export function FilterSection(props: FilterSectionComponentProps) {
  const local = useLocal({ mobileFilterOpen: props.mobileFilterOpen });

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block w-full lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-lg border p-6 sticky top-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Pencarian</h3>
          <FilterContent {...props} />
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Sheet 
        open={local.mobileFilterOpen} 
        onOpenChange={(open) => {
          local.mobileFilterOpen = open;
          props.setMobileFilterOpen(open);
          local.render();
        }}
      >
        <SheetContent side="bottom" className="h-[75vh] rounded-t-lg">
          <div className="overflow-auto h-full pb-6">
            <SheetHeader className="sticky top-0 bg-white z-10 pb-4">
              <SheetTitle>Filter Pencarian</SheetTitle>
              <SheetDescription>
                Atur filter untuk menemukan buku yang Anda cari
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 px-1">
              <FilterContent {...props} onSearch={() => {
                props.onSearch();
                local.mobileFilterOpen = false;
                props.setMobileFilterOpen(false);
                local.render();
              }} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}