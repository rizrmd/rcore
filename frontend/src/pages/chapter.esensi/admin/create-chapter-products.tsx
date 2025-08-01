import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Eye, Play } from "lucide-react";

export default () => {
  const local = useLocal({
    loading: false,
    results: null as any,
    dryRunResults: null as any
  });

  const runDryRun = async () => {
    local.loading = true;
    local.render();

    try {
      const result = await api.create_chapter_products({ dryRun: true });
      local.dryRunResults = result;
      console.log("Dry run results:", result);
    } catch (error) {
      console.error("Dry run error:", error);
    }

    local.loading = false;
    local.render();
  };

  const runActual = async () => {
    if (!confirm("Apakah Anda yakin ingin membuat produk untuk semua chapter yang belum memiliki produk?")) {
      return;
    }

    local.loading = true;
    local.render();

    try {
      const result = await api.create_chapter_products();
      local.results = result;
      console.log("Actual run results:", result);
    } catch (error) {
      console.error("Actual run error:", error);
    }

    local.loading = false;
    local.render();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Buat Produk untuk Chapter
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tool ini akan membuat produk baru untuk setiap chapter yang belum memiliki produk terkait.
          Gunakan dry run untuk melihat chapter mana saja yang akan diproses.
        </p>

        <div className="flex gap-4 mb-6">
          <Button
            onClick={runDryRun}
            disabled={local.loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {local.loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Dry Run (Preview)
          </Button>

          <Button
            onClick={runActual}
            disabled={local.loading}
            className="flex items-center gap-2"
          >
            {local.loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Jalankan Sekarang
          </Button>
        </div>

        {/* Dry Run Results */}
        {local.dryRunResults && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Hasil Dry Run</h3>
            <p className="text-blue-800 mb-4">{local.dryRunResults.message}</p>
            
            {local.dryRunResults.chapters && local.dryRunResults.chapters.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Chapter yang akan diproses:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {local.dryRunResults.chapters.map((chapter: any) => (
                    <div key={chapter.id} className="bg-blue-100 p-3 rounded text-sm">
                      <div className="font-medium">{chapter.book_name} - Chapter {chapter.number}</div>
                      <div className="text-blue-700">{chapter.name}</div>
                      <div className="text-blue-600">Harga: {chapter.coin_price} koin</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actual Results */}
        {local.results && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Hasil Eksekusi</h3>
            <p className="text-green-800 mb-4">{local.results.message}</p>
            
            {local.results.results && local.results.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-900">Detail Hasil:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {local.results.results.map((result: any, index: number) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded text-sm ${
                        result.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <div className="font-medium">{result.chapterName}</div>
                      {result.status === 'success' ? (
                        <div className="text-green-700">
                          ✓ Produk berhasil dibuat: {result.productName}
                        </div>
                      ) : (
                        <div className="text-red-700">
                          ✗ Error: {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};