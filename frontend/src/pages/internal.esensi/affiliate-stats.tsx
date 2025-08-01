import { Error } from "@/components/ext/error";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import type { Affiliate, AffiliateStats } from "shared/types";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default () => {
  const local = useLocal(
    {
      loading: true,
      error: "",
      affiliate: null as Affiliate | null,
      stats: null as AffiliateStats | null,
      isGlobalStats: false,
    },
    async () => {
      const params = new URLSearchParams(location.search);
      const id = params.get("id");
      if (!id) {
        // Global stats mode
        local.isGlobalStats = true;
        await loadGlobalStats();
      } else {
        // Specific affiliate stats mode
        await loadData(id);
      }
    }
  );

  const loadData = async (id: string) => {
    try {
      const [affiliateRes, statsRes] = await Promise.all([
        api.affiliate_get({ id }),
        api.affiliate_stats({ id }),
      ]);
      if (affiliateRes.success && affiliateRes.data)
        local.affiliate = affiliateRes.data;
      else {
        local.error = "Affiliate tidak ditemukan.";
        local.loading = false;
        local.render();
        return;
      }

      if (statsRes.success && statsRes.data) local.stats = statsRes.data;
    } catch (error) {
      local.error = "Terjadi kesalahan saat memuat data.";
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const loadGlobalStats = async () => {
    try {
      const statsRes = await api.affiliate_stats({});
      if (statsRes.success && statsRes.data) {
        local.stats = statsRes.data;
      } else {
        local.error = "Gagal memuat statistik global.";
      }
    } catch (error) {
      local.error = "Terjadi kesalahan saat memuat statistik global.";
    } finally {
      local.loading = false;
      local.render();
    }
  };

  if (!local.affiliate && !local.isGlobalStats) {
    return (
      <Layout loading={local.loading}>
        <MenuBarInternal />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Affiliate Tidak Ditemukan
            </h2>
            <Button onClick={() => navigate("/manage-affiliate")}>
              Kembali ke Daftar Affiliate
            </Button>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/manage-affiliate")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Daftar Affiliate
            </Button>
            <div className="flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Statistik Affiliate</h1>
                <p className="text-gray-600">
                  {local.isGlobalStats
                    ? "Statistik Global"
                    : local.affiliate?.name}
                </p>
              </div>
            </div>
          </div>

          <Error msg={local.error} />

          {local.stats ? (
            <div className="space-y-6">
              {/* Affiliate Information */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle>Informasi Affiliate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ID Affiliate</p>
                      <p className="font-medium">
                        {local.stats.affiliate?.id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nama Affiliate</p>
                      <p className="font-medium">
                        {local.stats.affiliate?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">User Terhubung</p>
                      <p className="font-medium">
                        {!local.stats.affiliate?.auth_user ? "❌" : "✅"}
                      </p>
                    </div>
                    {local.stats.affiliate?.auth_user && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Nama User</p>
                          <p className="font-medium">
                            {local.stats.affiliate.auth_user.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email User</p>
                          <p className="font-medium">
                            {local.stats.affiliate.auth_user.email || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status User</p>
                          <p className="font-medium">
                            {local.stats.affiliate.auth_user.email_verified
                              ? "Terverifikasi"
                              : "Belum terverifikasi"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Coming Soon Notice */}
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Statistik Performa Sedang Dikembangkan
                  </h3>
                  <p className="text-gray-500">
                    Fitur statistik detail seperti total referrals, komisi, dan
                    performa bulanan akan segera tersedia.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Statistik Tidak Tersedia
                </h3>
                <p className="text-gray-500">
                  Belum ada data statistik untuk affiliate ini.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </Layout>
  );
};
