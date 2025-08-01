import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import type {
  InternalOverallStats,
  InternalSpecificStats,
} from "shared/types";
import {
  ArrowLeft,
  Badge,
  BookCheck,
  Crown,
  HeadphonesIcon,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

export default () => {
  const local = useLocal(
    {
      loading: true,
      error: "",
      overallStats: null as InternalOverallStats | null,
      internalStats: null as InternalSpecificStats | null,
      searchInternalId: "",
      searchLoading: false,
      isIndividualInternal: false,
      internalIdFromUrl: "",
    },
    async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const internalId = urlParams.get("id");

      if (internalId) {
        local.isIndividualInternal = true;
        local.internalIdFromUrl = internalId;
        local.searchInternalId = internalId;
        await searchInternalStats();
      } else {
        await loadOverallStats();
      }
    }
  );

  const loadOverallStats = async () => {
    try {
      local.loading = true;
      local.error = "";
      local.render();

      const result = await api.internal_stats({});
      if (result && result.success)
        local.overallStats = result.data as InternalOverallStats;
    } catch (error: any) {
      console.error("Error loading overall stats:", error);
      local.error = error.message || "Terjadi kesalahan saat memuat statistik";
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const searchInternalStats = async () => {
    if (!local.searchInternalId.trim()) {
      local.error = "Masukkan ID internal untuk mencari statistik spesifik";
      local.loading = false;
      local.render();
      return;
    }

    try {
      local.loading = true;
      local.error = "";
      local.render();

      const result = await api.internal_stats({
        id: local.searchInternalId.trim(),
      });

      if (result && result.success)
        local.internalStats = result.data as InternalSpecificStats;
    } catch (error: any) {
      console.error("Error loading internal stats:", error);
      local.error =
        error.message || "Terjadi kesalahan saat mencari statistik internal";
      local.internalStats = null;
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const clearInternalSearch = () => {
    local.searchInternalId = "";
    local.internalStats = null;
    local.error = "";
    local.render();
  };

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <div className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-8">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/manage-internal")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Kelola Internal
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                Statistik Internal
              </h1>
              <p className="text-muted-foreground text-lg">
                Analisis data dan statistik internal di platform
              </p>
            </div>

            <Button
              variant="outline"
              onClick={loadOverallStats}
              disabled={local.loading}
              className="self-start sm:self-auto"
            >
              {local.loading ? (
                <>
                  <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </div>

        {local.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {local.error}
          </div>
        )}

        {local.overallStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Statistik Keseluruhan
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Internal
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.total_internals?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Jumlah total internal terdaftar
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Internal dengan Persetujuan Buku
                  </CardTitle>
                  <BookCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.internals_with_book_approvals?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Internal yang terlibat dalam persetujuan buku
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Persetujuan Buku
                  </CardTitle>
                  <BookCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.total_book_approvals?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total persetujuan buku yang telah diproses
                  </p>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-xl font-semibold mb-4 mt-6 flex items-center gap-2">
              <Badge className="h-5 w-5" />
              Statistik Berdasarkan Peran
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sales & Marketing
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {local.overallStats.roles?.sales_and_marketing?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Internal dengan peran Sales & Marketing
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Support</CardTitle>
                  <HeadphonesIcon className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {local.overallStats.roles?.support?.toLocaleString("id-ID")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Internal dengan peran Support
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Management
                  </CardTitle>
                  <Crown className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {local.overallStats.roles?.management?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Internal dengan peran Management
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">IT</CardTitle>
                  <Settings className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {local.overallStats.roles?.it?.toLocaleString("id-ID")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Internal dengan peran IT
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-6 w-6" />
            Statistik Internal Spesifik
          </h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cari Statistik Internal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-internal">ID Internal</Label>
                  <Input
                    id="search-internal"
                    type="text"
                    value={local.searchInternalId}
                    onChange={(e) => {
                      local.searchInternalId = e.target.value;
                      local.render();
                    }}
                    placeholder="Masukkan ID internal"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={searchInternalStats}
                    disabled={local.searchLoading}
                  >
                    {local.searchLoading ? (
                      <>
                        <Search className="h-4 w-4 mr-2 animate-spin" />
                        Mencari...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Cari
                      </>
                    )}
                  </Button>
                  {local.internalStats && (
                    <Button variant="outline" onClick={clearInternalSearch}>
                      Bersihkan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {local.internalStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {local.internalStats.name}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  ID: {local.internalStats.id}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BookCheck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {local.internalStats.book_approval_count}
                    </div>
                    <p className="text-sm text-blue-700">Persetujuan Buku</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Badge className="h-5 w-5" />
                    Peran Internal
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {local.internalStats.roles?.sales_and_marketing && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Sales & Marketing
                        </span>
                      </div>
                    )}
                    {local.internalStats.roles?.support && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <HeadphonesIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          Support
                        </span>
                      </div>
                    )}
                    {local.internalStats.roles?.management && (
                      <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                          Management
                        </span>
                      </div>
                    )}
                    {local.internalStats.roles?.it && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <Settings className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">
                          IT
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/internal-detail?id=${local.internalStats?.id}`)
                    }
                  >
                    Lihat Detail Internal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};
