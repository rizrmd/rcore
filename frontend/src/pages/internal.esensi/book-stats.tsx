import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/gen/publish.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import { formatCurrency } from "@/lib/utils";
import type {
  BookOverallStatsResponse,
  BookStatsResponse,
} from "shared/types";
import {
  ArrowLeft,
  Book,
  Library,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";

export default () => {
  const local = useLocal(
    {
      loading: true,
      error: "",
      overallStats: null as BookOverallStatsResponse | null,
      bookStats: null as BookStatsResponse | null,
      searchBookId: "",
      searchLoading: false,
      isSpecificBook: false,
    },
    async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const bookId = urlParams.get("id");

      if (bookId) {
        local.isSpecificBook = true;
        local.searchBookId = bookId;
        await searchBookStats();
      } else await loadOverallStats();
    }
  );

  const loadOverallStats = async () => {
    try {
      local.loading = true;
      local.error = "";
      local.render();

      const result = await api.book_stats({});
      if (result) local.overallStats = result as BookOverallStatsResponse;
    } catch (error: any) {
      console.error("Error loading overall stats:", error);
      local.error = error.message || "Error loading book statistics";
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const searchBookStats = async () => {
    if (!local.searchBookId.trim()) {
      local.error = "Enter a book ID to search specific statistics";
      local.loading = false;
      local.render();
      return;
    }

    try {
      local.searchLoading = true;
      local.error = "";
      local.render();

      const result = await api.book_stats({
        id: local.searchBookId.trim(),
      });
      if (result) local.bookStats = result as BookStatsResponse;
    } catch (error: any) {
      console.error("Error loading book stats:", error);
      local.error = error.message || "Error searching book statistics";
      local.bookStats = null;
    } finally {
      local.searchLoading = false;
      local.loading = false;
      local.render();
    }
  };

  const clearBookSearch = () => {
    local.searchBookId = "";
    local.bookStats = null;
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
              onClick={() => navigate("/manage-book")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manage Books
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                  <Library className="h-6 w-6" />
                </div>
                Statistik Buku
              </h1>
              <p className="text-muted-foreground text-lg">
                Analisa data dan statistik buku
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
                  Loading...
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

        {local.overallStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Overall Book Stats
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Books
                  </CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.book_counts?.total?.toLocaleString(
                      "id-ID"
                    ) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total registered books
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Published Books
                  </CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.book_counts?.published?.toLocaleString(
                      "id-ID"
                    ) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Number of books published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Draft Books
                  </CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.book_counts?.draft?.toLocaleString(
                      "id-ID"
                    ) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Draft status books
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sales
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {local.overallStats.sales_stats?.total_sales?.toLocaleString(
                      "id-ID"
                    ) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total book sales
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      local.overallStats.sales_stats?.total_revenue
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total revenue from books
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-6 w-6" />
            Specific Book Statistics
          </h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search for Book Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-book">Book ID</Label>
                  <Input
                    id="search-book"
                    type="text"
                    value={local.searchBookId}
                    onChange={(e) => {
                      local.searchBookId = e.target.value;
                      local.render();
                    }}
                    placeholder="Enter book ID"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={searchBookStats}
                    disabled={local.searchLoading}
                  >
                    {local.searchLoading ? (
                      <>
                        <Search className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                  {local.bookStats && (
                    <Button variant="outline" onClick={clearBookSearch}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {local.bookStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  {local.bookStats.book?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Book className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {local.bookStats.genre_count}
                    </div>
                    <p className="text-sm text-blue-700">Genres</p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Book className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {local.bookStats.tag_count}
                    </div>
                    <p className="text-sm text-green-700">Tags</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Book className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">
                      {local.bookStats.chapter_count}
                    </div>
                    <p className="text-sm text-purple-700">Chapters</p>
                  </div>

                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Book className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-600">
                      {local.bookStats.review_count}
                    </div>
                    <p className="text-sm text-orange-700">Reviews</p>
                  </div>

                  <div className="text-center p-4 bg-cyan-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-cyan-600" />
                    <div className="text-2xl font-bold text-cyan-600">
                      {local.bookStats.sales_stats?.total_sales?.toLocaleString(
                        "id-ID"
                      ) || 0}
                    </div>
                    <p className="text-sm text-cyan-700">Total Sales</p>
                  </div>

                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-pink-600" />
                    <div className="text-2xl font-bold text-pink-600">
                      {formatCurrency(
                        local.bookStats.sales_stats?.total_revenue
                      )}
                    </div>
                    <p className="text-sm text-pink-700">Total Revenue</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    Book Information
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge
                        variant={
                          local.bookStats.book?.status === "published"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {local.bookStats.book?.status || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(local.bookStats.book?.submitted_price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Slug:</span>
                      <span className="text-sm font-medium">
                        {local.bookStats.book?.slug || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Author:</span>
                      <span className="text-sm font-medium">
                        {local.bookStats.book?.author?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Average Rating:
                      </span>
                      <span className="text-sm font-medium">
                        {local.bookStats.average_rating?.toFixed(1) || "0.0"} /
                        5
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">
                        {local.bookStats.book?.is_physical
                          ? "Physical"
                          : "Digital"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/book-detail?id=${local.bookStats!.book?.id}`)
                    }
                  >
                    View Book Details
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
