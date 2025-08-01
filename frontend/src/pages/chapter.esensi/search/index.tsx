import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { useLocal } from "@/lib/hooks/use-local";
import { Input } from "@/components/ui/input";
import { navigate } from "@/lib/router";

export default () => {
  const local = useLocal({ 
    searchQuery: "",
    loading: false
  });

  const handleSearch = async () => {
    if (!local.searchQuery.trim()) {
      return;
    }
    
    local.loading = true;
    local.render();
    
    const encodedQuery = encodeURIComponent(local.searchQuery.trim());
    navigate(`/search/${encodedQuery}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <EsensiChapterLayout>
      <div className="w-full min-h-screen bg-gray-50">
        <div className="esensi-container mx-auto">
          {/* Page Header */}
          <div className="pt-8 pb-6">
            <div className="text-center">
              <SearchIcon className="mx-auto h-16 w-16 text-blue-600 mb-6" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Pencarian Buku
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Cari dan temukan buku favorit Anda berdasarkan judul, penulis, genre, atau tag. Masukkan kata kunci untuk memulai pencarian.
              </p>
              
              {/* Main Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari berdasarkan judul, penulis, genre, atau tag..."
                    value={local.searchQuery}
                    onChange={(e) => {
                      local.searchQuery = e.target.value;
                      local.render();
                    }}
                    onKeyPress={handleKeyPress}
                    className="pl-12 pr-4 py-4 text-lg w-full rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors shadow-sm"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={local.loading || !local.searchQuery.trim()}
                    size="lg"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 rounded-lg"
                  >
                    {local.loading ? "Mencari..." : "Cari"}
                  </Button>
                </div>
              </div>

              {/* Search Suggestions */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-4">Coba pencarian populer:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["romance", "fantasi", "action", "comedy", "mystery", "slice of life"].map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => {
                        local.searchQuery = keyword;
                        local.render();
                        handleSearch();
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors border border-gray-200 hover:border-gray-300"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alternative Options */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/browse')}
                  className="flex items-center gap-2"
                >
                  Jelajahi Semua Buku
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/rankings')}
                  className="flex items-center gap-2"
                >
                  Lihat Ranking
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EsensiChapterLayout>
  );
};