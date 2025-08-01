import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { Breadcrumb } from "@/components/ext/publisher/breadcrumb/stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import { formatCurrency } from "@/lib/utils";
import type {
  PublisherOverallStats,
  PublisherSpecificStats,
} from "shared/types";
import {
  ArrowLeft,
  BarChart3,
  Book,
  Building,
  CreditCard,
  DollarSign,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export default () => {
  const local = useLocal(
    {
      loading: true,
      error: "",
      overallStats: null as PublisherOverallStats | null,
      publisherStats: null as PublisherSpecificStats | null,
      searchPublisherId: "",
      searchLoading: false,
      specificPublisherId: "",
    },
    async () => {
      const params = new URLSearchParams(location.search);
      const id = params.get("id");
      if (id) {
        local.specificPublisherId = id;
        local.searchPublisherId = id;
        await loadSpecificPublisher(id);
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

      const result = await api.publisher_stats({});
      local.overallStats = result as PublisherOverallStats;
    } catch (error: any) {
      console.error("Error loading overall stats:", error);
      local.error = error.message || "Terjadi kesalahan saat memuat statistik";
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const searchPublisherStats = async () => {
    if (!local.searchPublisherId.trim()) {
      local.error = "Masukkan ID penerbit untuk mencari statistik spesifik";
      local.render();
      return;
    }

    try {
      local.searchLoading = true;
      local.error = "";
      local.render();

      const result = await api.publisher_stats({
        id: local.searchPublisherId.trim(),
      });

      if (result && result.publisher) {
        local.publisherStats = result as PublisherSpecificStats;
      }
    } catch (error: any) {
      console.error("Error loading publisher stats:", error);
      local.error =
        error.message || "Terjadi kesalahan saat mencari statistik penerbit";
      local.publisherStats = null;
    } finally {
      local.searchLoading = false;
      local.render();
    }
  };

  const loadSpecificPublisher = async (id: string) => {
    try {
      local.loading = true;
      local.error = "";
      local.render();

      const result = await api.publisher_stats({ id });
      if (result && result.publisher) {
        local.publisherStats = result as PublisherSpecificStats;
      }
    } catch (error: any) {
      console.error("Error loading specific publisher stats:", error);
      local.error =
        error.message || "Terjadi kesalahan saat memuat statistik penerbit";
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const clearPublisherSearch = () => {
    local.searchPublisherId = "";
    local.publisherStats = null;
    local.error = "";
    local.render();
  };

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <div className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          {/* Breadcrumb for specific publisher */}
          {local.specificPublisherId && local.publisherStats && (
            <Breadcrumb publisherId={local.specificPublisherId} />
          )}

          {/* Back Button for general stats */}
          {!local.specificPublisherId && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/manage-publisher")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Kelola Penerbit
              </Button>
            </div>
          )}

          {/* Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                Statistik Penerbit
              </h1>
              <p className="text-muted-foreground text-lg">
                Analisis data dan statistik penerbit di platform
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
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
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

        {/* Overall Statistics */}
        {local.overallStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Statistik Keseluruhan
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Penerbit
                  </CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.total_publishers?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Jumlah total penerbit terdaftar
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Penerbit dengan Penulis
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.publishers_with_authors?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Penerbit yang memiliki penulis
                  </p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {(
                        (local.overallStats.publishers_with_authors! /
                          local.overallStats.total_publishers!) *
                        100
                      ).toFixed(1)}
                      %
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Penerbit dengan Kode Promo
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.publishers_with_promo_codes?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Penerbit yang memiliki kode promo
                  </p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {(
                        (local.overallStats.publishers_with_promo_codes! /
                          local.overallStats.total_publishers!) *
                        100
                      ).toFixed(1)}
                      %
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Penerbit dengan Transaksi
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.publishers_with_transactions?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Penerbit yang memiliki transaksi
                  </p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {(
                        (local.overallStats.publishers_with_transactions! /
                          local.overallStats.total_publishers!) *
                        100
                      ).toFixed(1)}
                      %
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Penerbit dengan Penarikan
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.publishers_with_withdrawals?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Penerbit yang melakukan penarikan
                  </p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {(
                        (local.overallStats.publishers_with_withdrawals! /
                          local.overallStats.total_publishers!) *
                        100
                      ).toFixed(1)}
                      %
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Transaksi
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      local.overallStats.total_transaction_amount
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total nilai transaksi semua penerbit
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Penarikan
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(local.overallStats.total_withdrawal_amount)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total nilai penarikan semua penerbit
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo Tersisa
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      Number(local.overallStats.total_transaction_amount) -
                        Number(local.overallStats.total_withdrawal_amount)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sisa saldo keseluruhan penerbit
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Publisher-Specific Search */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-6 w-6" />
            Statistik Penerbit Spesifik
          </h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cari Statistik Penerbit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-publisher">ID Penerbit</Label>
                  <Input
                    id="search-publisher"
                    type="text"
                    value={local.searchPublisherId}
                    onChange={(e) => {
                      local.searchPublisherId = e.target.value;
                      local.render();
                    }}
                    placeholder="Masukkan ID penerbit"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={searchPublisherStats}
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
                  {local.publisherStats && (
                    <Button variant="outline" onClick={clearPublisherSearch}>
                      Bersihkan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publisher-Specific Results */}
          {local.publisherStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {local.publisherStats.name}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>ID: {local.publisherStats.id}</span>
                  {local.publisherStats.website && (
                    <span>
                      Website:{" "}
                      <a
                        href={local.publisherStats.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {local.publisherStats.website}
                      </a>
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {local.publisherStats.author_count}
                    </div>
                    <p className="text-sm text-blue-700">Penulis</p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Book className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {local.publisherStats.book_count}
                    </div>
                    <p className="text-sm text-green-700">Buku</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">
                      {local.publisherStats.product_count}
                    </div>
                    <p className="text-sm text-purple-700">Produk</p>
                  </div>

                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-600">
                      {local.publisherStats.promo_code_count}
                    </div>
                    <p className="text-sm text-orange-700">Kode Promo</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Transaksi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Jumlah Transaksi:
                          </span>
                          <span className="font-medium">
                            {local.publisherStats.transaction_count}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Nilai:
                          </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(
                              local.publisherStats.transaction_total
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-red-600" />
                        Penarikan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Jumlah Penarikan:
                          </span>
                          <span className="font-medium">
                            {local.publisherStats.withdrawal_count}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Nilai:
                          </span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(
                              local.publisherStats.withdrawal_total
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Saldo Tersisa:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(
                        Number(local.publisherStats.transaction_total) -
                          Number(local.publisherStats.withdrawal_total)
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/publisher-detail?id=${local.publisherStats!.id}`
                      )
                    }
                  >
                    Lihat Detail Penerbit
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
