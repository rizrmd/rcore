import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api as publishApi } from "@/lib/gen/publish.esensi";
import { api as internalApi } from "@/lib/gen/internal.esensi";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { book, chapter } from "shared/models";

interface MonetizationTabProps {
  bookId: string;
}

interface MonetizationConfig {
  minimum_chapters_to_monetize: number;
  minimum_words_per_chapter_to_monetize: number;
}

export const MonetizationTab: React.FC<MonetizationTabProps> = ({ bookId }) => {
  const [book, setBook] = useState<book | null>(null);
  const [chapters, setChapters] = useState<chapter[]>([]);
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [bookId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load book data
      const bookResponse = await publishApi.books({
        action: "detail",
        id: bookId,
      });
      if (bookResponse.success && bookResponse.data) {
        setBook(bookResponse.data);
      }

      // Load chapters
      const chaptersResponse = await publishApi.books({
        action: "nested_list",
        nested_model: "chapter",
        parent_id: bookId,
        limit: 1000,
      });
      if (chaptersResponse.success && chaptersResponse.data) {
        setChapters(chaptersResponse.data);
      }

      // Load monetization config
      const configResponse = await internalApi.cfg_get({
        key: "chapter",
      });
      if (configResponse.data) {
        try {
          const configValue = JSON.parse(configResponse.data.value);
          setConfig(configValue);
        } catch (e) {
          console.error("Failed to parse config", e);
        }
      }
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = () => {
    if (!book || !chapters || !config) return { eligible: false, reasons: ["Data is loading..."] };

    const reasons: string[] = [];

    // Check number of chapters
    if (chapters.length < config.minimum_chapters_to_monetize) {
      reasons.push(`Minimal ${config.minimum_chapters_to_monetize} chapter diperlukan (saat ini: ${chapters.length})`);
    }

    // Check word count per chapter
    const chaptersWithLowWordCount = chapters.filter(
      ch => ch.word_count < config.minimum_words_per_chapter_to_monetize
    );
    if (chaptersWithLowWordCount.length > 0) {
      reasons.push(
        `Semua chapter harus memiliki minimal ${config.minimum_words_per_chapter_to_monetize} kata (${chaptersWithLowWordCount.length} chapter tidak memenuhi syarat)`
      );
    }

    // Check if book is published
    if (book.status !== "published") {
      reasons.push("Buku harus sudah diterbitkan");
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  };

  const handleMonetizationRequest = async () => {
    if (!book) return;

    try {
      setSubmitting(true);
      setError(null);

      // Update book to set story_monetized to true
      const response = await publishApi.books({
        action: "update",
        id: bookId,
        data: {
          story_monetized: true,
        },
      });

      if (response.success) {
        await loadData(); // Reload to get updated data
      } else {
        throw new Error(response.message || "Failed to update monetization status");
      }
    } catch (err) {
      setError("Failed to submit monetization request");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const { eligible, reasons } = checkEligibility();
  const isMonetized = book?.story_monetized || false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status Monetisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isMonetized ? (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="ml-2">
                  Buku ini sudah dimonetisasi. Pembaca perlu menggunakan koin untuk membaca chapter yang berbayar.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  Buku ini belum dimonetisasi. Ajukan monetisasi untuk mengaktifkan pembayaran dengan koin.
                </AlertDescription>
              </Alert>
            )}

            {!isMonetized && (
              <>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Syarat Monetisasi:</h4>
                  <ul className="space-y-1 text-sm">
                    <li className={chapters.length >= (config?.minimum_chapters_to_monetize || 0) ? "text-green-600" : "text-gray-600"}>
                      {chapters.length >= (config?.minimum_chapters_to_monetize || 0) ? "✓" : "○"} Minimal {config?.minimum_chapters_to_monetize || 0} chapter
                    </li>
                    <li className={chapters.every(ch => ch.word_count >= (config?.minimum_words_per_chapter_to_monetize || 0)) ? "text-green-600" : "text-gray-600"}>
                      {chapters.every(ch => ch.word_count >= (config?.minimum_words_per_chapter_to_monetize || 0)) ? "✓" : "○"} Minimal {config?.minimum_words_per_chapter_to_monetize || 0} kata per chapter
                    </li>
                    <li className={book?.status === "published" ? "text-green-600" : "text-gray-600"}>
                      {book?.status === "published" ? "✓" : "○"} Buku sudah diterbitkan
                    </li>
                  </ul>
                </div>

                {!eligible && reasons.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <div className="ml-2">
                      <p className="font-medium">Belum memenuhi syarat:</p>
                      <ul className="mt-1 text-sm list-disc list-inside">
                        {reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </Alert>
                )}

                <Button
                  onClick={handleMonetizationRequest}
                  disabled={!eligible || submitting}
                  className="w-full"
                >
                  {submitting ? "Mengajukan..." : "Ajukan Monetisasi"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {isMonetized && (
        <Card>
          <CardHeader>
            <CardTitle>Statistik Monetisasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600">Chapter Berbayar</p>
                <p className="text-2xl font-bold">
                  {chapters.filter(ch => Number(ch.coin_price) > 0).length} / {chapters.length}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Pendapatan Koin</p>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-gray-500">Fitur akan datang</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};