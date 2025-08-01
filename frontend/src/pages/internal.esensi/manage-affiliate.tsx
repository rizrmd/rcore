import { affiliate, Item } from "@/components/ext/affiliate/item-manage";
import { Error } from "@/components/ext/error";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPagination } from "@/components/ui/data-pagination";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import { ItemLayoutEnum } from "@/lib/utils";
import type { Affiliate } from "shared/types";
import { BarChart3, Edit, PlusCircle, Search } from "lucide-react";

export default () => {
  const local = useLocal(
    {
      affiliates: [] as Affiliate[],
      loading: true,
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
      error: "",
      search: "",
      layout: ItemLayoutEnum.GRID,
      searchTimeout: null as NodeJS.Timeout | null,
    },
    async () => {
      const params = new URLSearchParams(location.search);
      local.page = parseInt(params.get("page") || ("1" as string)) as number;
      local.limit = parseInt(params.get("limit") || ("50" as string)) as number;
      local.search = params.get("search") || "";
      await loadData();
    }
  );

  async function loadData() {
    local.loading = true;
    local.render();
    try {
      const res = await api.affiliate_list({
        page: local.page,
        limit: local.limit,
        search: local.search || undefined,
      });

      if (res.success) {
        local.affiliates = res.data || [];
        local.total = res.pagination?.total || 0;
        local.totalPages = res.pagination?.totalPages || 0;
      } else local.error = "Gagal memuat data affiliate.";
    } catch (error) {
      local.error = "Terjadi kesalahan saat memuat data.";
    } finally {
      local.loading = false;
      local.render();
    }
  }

  const handleSearchChange = (value: string) => {
    local.search = value;
    local.render();

    // Clear existing timeout
    if (local.searchTimeout) {
      clearTimeout(local.searchTimeout);
    }

    // Set new timeout for debounced search
    local.searchTimeout = setTimeout(async () => {
      local.page = 1; // Reset to first page when searching
      await loadData();
    }, 500); // 500ms delay
  };

  const handleSearch = async () => {
    local.page = 1;
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", local.limit.toString());
    if (local.search) params.set("search", local.search);

    history.pushState(null, "", `${location.pathname}?${params.toString()}`);
    await loadData();
  };

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Error msg={local.error} />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="mx-8 py-8">
              <div className="flex justify-between items-start mb-8 gap-4">
                <h1 className="text-2xl font-bold">Daftar Affiliate</h1>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => navigate("/affiliate-stats")}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Affiliate Stats</span>
                  </Button>
                  <Button
                    onClick={() => navigate("/affiliate-create")}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>Tambah Affiliate</span>
                  </Button>
                  <DataPagination
                    total={local.total}
                    page={local.page}
                    limit={local.limit}
                    totalPages={local.totalPages}
                    onReload={loadData}
                    onPageChange={async (newPage) => {
                      local.page = newPage;
                      local.render();
                      const params = new URLSearchParams(location.search);
                      params.set("page", newPage.toString());
                      history.pushState(
                        null,
                        "",
                        `${location.pathname}?${params.toString()}`
                      );
                      await loadData();
                    }}
                    onLimitChange={async (newLimit) => {
                      local.limit = newLimit;
                      local.page = 1;
                      local.render();
                      const params = new URLSearchParams(location.search);
                      params.set("page", "1");
                      params.set("limit", newLimit.toString());
                      history.pushState(
                        null,
                        "",
                        `${location.pathname}?${params.toString()}`
                      );
                      await loadData();
                    }}
                    layout={local.layout}
                    onLayoutChange={(value) => {
                      local.layout = value;
                      local.render();
                    }}
                  />
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pencarian</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Input
                        value={local.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Cari berdasarkan nama..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            // Clear existing timeout and search immediately
                            if (local.searchTimeout) {
                              clearTimeout(local.searchTimeout);
                            }
                            local.page = 1;
                            loadData();
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          // Clear existing timeout and search immediately
                          if (local.searchTimeout) {
                            clearTimeout(local.searchTimeout);
                          }
                          local.page = 1;
                          loadData();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" />
                        Cari
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {local.loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">
                    Memuat data affiliate...
                  </p>
                </div>
              ) : local.affiliates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {local.search ? (
                    <p>
                      Tidak ada affiliate yang ditemukan untuk pencarian "
                      {local.search}"
                    </p>
                  ) : (
                    <p>Belum ada affiliate.</p>
                  )}
                </div>
              ) : (
                <>
                  {local.layout === ItemLayoutEnum.GRID && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {local.affiliates.map((affiliateItem: Affiliate) => (
                        <Card
                          key={affiliateItem.id}
                          className="flex flex-col h-full shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                          <CardHeader className="flex-1">
                            <CardTitle className="text-lg font-semibold line-clamp-2 mb-2">
                              {affiliateItem.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="space-y-3">
                              <Item
                                type={local.layout}
                                item={affiliate(affiliateItem)}
                              />

                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/affiliate-detail?id=${affiliateItem.id}`
                                    )
                                  }
                                  className="flex-1"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Detail
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/affiliate-stats?id=${affiliateItem.id}`
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {local.layout === ItemLayoutEnum.LIST && (
                    <div className="space-y-4">
                      {local.affiliates.map((affiliateItem: Affiliate) => (
                        <Card
                          key={affiliateItem.id}
                          className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">
                                  {affiliateItem.name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm">
                                  <Item
                                    type={local.layout}
                                    item={affiliate(affiliateItem)}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/affiliate-detail?id=${affiliateItem.id}`
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/affiliate-stats?id=${affiliateItem.id}`
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  Stats
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};
