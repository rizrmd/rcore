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
  CustomerOverallStats,
  CustomerSpecificStats,
} from "shared/types";
import { ArrowLeft, BarChart3, Search, TrendingUp, Users } from "lucide-react";

export default () => {
  const local = useLocal(
    {
      loading: true,
      error: "",
      overallStats: null as CustomerOverallStats | null,
      customerStats: null as CustomerSpecificStats | null,
      searchCustomerId: "",
      searchLoading: false,
      isIndividualCustomer: false,
      customerIdFromUrl: "",
    },
    async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const customerId = urlParams.get("id");

      if (customerId) {
        local.isIndividualCustomer = true;
        local.customerIdFromUrl = customerId;
        local.searchCustomerId = customerId;
        await searchCustomerStats();
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

      const result = await api.customer_stats({});
      if (result) local.overallStats = result as CustomerOverallStats;
    } catch (error: any) {
      console.error("Error loading overall stats:", error);
      local.error = error.message || "Terjadi kesalahan saat memuat statistik";
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const searchCustomerStats = async () => {
    if (!local.searchCustomerId.trim()) {
      local.error = "Masukkan ID pelanggan untuk mencari statistik spesifik";
      local.loading = false;
      local.render();
      return;
    }

    try {
      local.loading = true;
      local.error = "";
      local.render();

      const result = await api.customer_stats({
        id: local.searchCustomerId.trim(),
      });

      if (result) local.customerStats = result as CustomerSpecificStats;
    } catch (error: any) {
      console.error("Error loading customer stats:", error);
      local.error =
        error.message || "Terjadi kesalahan saat mencari statistik pelanggan";
      local.customerStats = null;
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const clearCustomerSearch = () => {
    local.searchCustomerId = "";
    local.customerStats = null;
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
              onClick={() => navigate("/manage-customer")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Kelola Pelanggan
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                Statistik Pelanggan
              </h1>
              <p className="text-muted-foreground text-lg">
                Analisis data dan statistik pelanggan di platform
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
          <div className="mb-6 pl-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
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
                    Total Pelanggan
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.total_customers?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Jumlah total pelanggan terdaftar
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pelanggan Aktif
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.active_customers?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Jumlah pelanggan yang aktif
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pelanggan dengan Penjualan
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.customers_with_sales?.toLocaleString(
                      "id-ID"
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pelanggan yang telah melakukan penjualan
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-6 w-6" />
            Statistik Pelanggan Spesifik
          </h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cari Statistik Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-customer">ID Pelanggan</Label>
                  <Input
                    id="search-customer"
                    type="text"
                    value={local.searchCustomerId}
                    onChange={(e) => {
                      local.searchCustomerId = e.target.value;
                      local.render();
                    }}
                    placeholder="Masukkan ID pelanggan"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={searchCustomerStats}
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
                  {local.customerStats && (
                    <Button variant="outline" onClick={clearCustomerSearch}>
                      Bersihkan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {local.customerStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {local.customerStats.name}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  ID: {local.customerStats.id}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {local.customerStats.sales_count}
                    </div>
                    <p className="text-sm text-blue-700">Penjualan</p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {local.customerStats.download_count}
                    </div>
                    <p className="text-sm text-green-700">Unduhan</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">
                      {local.customerStats.track_count}
                    </div>
                    <p className="text-sm text-purple-700">Pelacakan</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/customer-detail?id=${local.customerStats!.id}`)
                    }
                  >
                    Lihat Detail Pelanggan
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
