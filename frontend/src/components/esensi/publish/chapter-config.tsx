import type { CRUDConfig } from "@/components/core/ecrud/ecrud";
import type { BreadcrumbItem } from "@/components/core/ecrud/types";
import { ChapterEditor } from "@/components/ext/chapter/chapter-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/gen/internal.esensi";
import { api as publishApi } from "@/lib/gen/publish.esensi";
import { AlertCircle, ArrowLeft, Edit } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import type { chapter } from "shared/models";
import { ChapterNumberField } from "./chapter-number-field";
import { formatThousands } from "@/lib/utils";

// Component to display monetization eligibility message
export const MonetizationEligibilityMessage: React.FC = () => {
  const bookId = (window as any).currentBookId;
  const { isMonetizationEnabled, loading, eligibilityDetails } =
    useMonetizationEligibility(bookId);

  if (loading || isMonetizationEnabled || !eligibilityDetails || !bookId) {
    return null;
  }

  return (
    <div className="max-w-[600px] w-full mx-auto px-2 mb-4">
      <div className="text-red-500 text-sm leading-relaxed">
        Untuk monetisasi, harus ada minimal{" "}
        {eligibilityDetails.requiredChapters} chapter dengan{" "}
        {eligibilityDetails.requiredWordCount} jumlah kata, tetapi Anda hanya
        memiliki {eligibilityDetails.currentEligibleChapters} chapter dengan{" "}
        {eligibilityDetails.requiredWordCount} jumlah kata.
      </div>
    </div>
  );
};

// Wrapper component for coin price field
export const CoinPriceField: React.FC<any> = (props) => {
  const bookId = (window as any).currentBookId;
  const { isMonetizationEnabled, loading } = useMonetizationEligibility(bookId);

  return (
    <div>
      <input
        type="number"
        value={props.value || 0}
        onChange={(e) => props.onChange(parseInt(e.target.value) || 0)}
        disabled={props.disabled || !isMonetizationEnabled}
        className={`w-full px-3 py-2 border rounded-md ${
          props.disabled || !isMonetizationEnabled
            ? "bg-gray-100 cursor-not-allowed"
            : ""
        }`}
        name={props.name}
      />
      {loading && (
        <span className="text-xs text-gray-500 ml-2">
          Mengecek kelayakan...
        </span>
      )}
      {!isMonetizationEnabled && !loading && bookId && (
        <span className="text-xs text-red-500 ml-2">
          Tidak layak untuk monetisasi
        </span>
      )}
    </div>
  );
};


/**
 * Hook to check monetization eligibility for a book
 */
export const useMonetizationEligibility = (parentBookId?: string | number) => {
  const [isMonetizationEnabled, setIsMonetizationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [eligibilityDetails, setEligibilityDetails] = useState<{
    requiredChapters: number;
    requiredWordCount: number;
    currentEligibleChapters: number;
  } | null>(null);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!parentBookId) {
        setIsMonetizationEnabled(true);
        return;
      }

      try {
        setLoading(true);
        const cfgResponse = await api.cfg_get({
          key: "chapter",
        });

        if (cfgResponse.data) {
          const chaptersRule: {
            minimum_chapters_to_monetize: number;
            minimum_words_per_chapter_to_monetize: number;
          } = JSON.parse(cfgResponse.data.value);

          // Get all chapters for this book first
          const chaptersResponse = await publishApi.chapters({
            action: "list",
            id_book: parentBookId,
          });

          if (chaptersResponse.success && chaptersResponse.data) {
            // The actual chapters array is nested in data.data
            const allChapters = chaptersResponse.data.data || [];

            // Filter chapters client-side based on word count
            const eligibleChapters = allChapters.filter(
              (chapter: any) =>
                chapter.word_count >
                chaptersRule.minimum_words_per_chapter_to_monetize
            );

            const eligibleChaptersCount = eligibleChapters.length;
            const isEligible =
              eligibleChaptersCount >=
              chaptersRule.minimum_chapters_to_monetize;

            setIsMonetizationEnabled(isEligible);
            setEligibilityDetails({
              requiredChapters: chaptersRule.minimum_chapters_to_monetize,
              requiredWordCount:
                chaptersRule.minimum_words_per_chapter_to_monetize,
              currentEligibleChapters: eligibleChaptersCount,
            });
          } else {
            setIsMonetizationEnabled(true); // Default to enabled on error
          }
        }
      } catch (error) {
        setIsMonetizationEnabled(true); // Default to enabled on error
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();
  }, [parentBookId]);

  return { isMonetizationEnabled, loading, eligibilityDetails };
};

/**
 * Chapter CRUD Configuration
 * Provides the configuration for managing chapters in a side-by-side layout
 */
export const createChapterCRUDConfig = (
  parentBookId?: string | number
): CRUDConfig<chapter> => ({
  entityName: "Chapter",
  entityNamePlural: "Chapters",
  columns: [],
  filters: [{ key: "name", label: "Judul", type: "text" }],
  softDelete: {
    enabled: true,
    field: "deleted_at",
  },
  renderRow: ({ entity, isSelected, onClick }) => {
    const bookId = parentBookId || entity?.id_book;
    const { isMonetizationEnabled } = useMonetizationEligibility(
      bookId || undefined
    );

    return (
      <div
        className={`flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer ${
          isSelected ? "bg-blue-50" : ""
        }`}
        onClick={onClick}
      >
        <div className="flex-1">
          <div className="font-medium">
            {entity.number} {entity.name || "Unknown Chapter"}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            {entity.coin_price && (
              <div className="flex items-center gap-1">
                <span>
                  {entity.coin_price.toString() !== "0" && isMonetizationEnabled
                    ? `${entity.coin_price} coin`
                    : "Gratis"}{" "}
                </span>
                {entity.coin_price.toString() !== "0" &&
                  !isMonetizationEnabled && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                      Tidak Layak Monetisasi
                    </span>
                  )}
              </div>
            )}
            {entity.word_count > 0 && <span>{formatThousands(entity.word_count)} kata</span>}
          </div>
        </div>
      </div>
    );
  },
  formFields: [
    {
      name: "number",
      label: "Nomor Chapter",
      type: "custom",
      required: true,
      width: "1/3",
      defaultValue: 0,
      customComponent: ChapterNumberField,
      customProps: {
        parentBookId: parentBookId,
      },
    },
    {
      name: "name",
      label: "Judul Chapter",
      type: "text",
      required: true,
      width: "full",
      defaultValue: "",
    },
    {
      name: "coin_price",
      label: "Harga Koin",
      type: "custom",
      required: false,
      width: "full",
      defaultValue: 0,
      customComponent: CoinPriceField,
    },
    // {
    //   name: "word_count",
    //   label: "Jumlah Kata",
    //   type: "number",
    //   width: "1/2",
    //   disabled: true,
    //   defaultValue: 0,
    // },
    {
      name: "is_published",
      label: "Diterbitkan",
      type: "hidden",
      width: "full",
      defaultValue: false,
    },
  ],
  actions: {
    list: {
      create: true,
      view: true,
      edit: true,
      delete: true,
      search: true,
      filter: true,
      sort: true,
      pagination: false,
      bulkSelect: true,
      viewTrash: false,
      restore: true,
    },
  },
});

/**
 * Chapter Custom Form Renderer
 * Creates the custom form renderer for chapter editing with the ChapterEditor
 */
export const createChapterFormRenderer =
  (parentBookId?: string) =>
  ({
    entity,
    formMode,
    loading: _loading,
    onSave,
    onDelete,
    onCancel: _onCancel,
    breadcrumbs: _breadcrumbs,
    onBreadcrumbClick: _onBreadcrumbClick,
    OriginalForm,
  }: {
    entity: chapter | null;
    formMode: "create" | "edit" | null;
    loading: boolean;
    onSave: (formData: any, returnToList?: boolean) => Promise<void>;
    onDelete: (entity: chapter) => Promise<void>;
    onCancel: () => void;
    breadcrumbs: BreadcrumbItem[];
    onBreadcrumbClick: (url: string) => void;
    OriginalForm: React.ForwardRefExoticComponent<any>;
  }) => {
    // Set the book ID in window context so ChapterNumberField can access it
    const bookId = parentBookId || entity?.id_book;
    if (bookId) {
      (window as any).currentBookId = bookId;
    }
    const [activeTab, setActiveTab] = useState("form");
    const prevEntityIdRef = useRef<string | number | null>(null);

    // Check if this is a newly created chapter (transition from create to edit)
    useEffect(() => {
      if (
        formMode === "edit" &&
        entity?.id &&
        prevEntityIdRef.current === null
      ) {
        // This is likely a new chapter that was just created
        setActiveTab("editor");
      }
      prevEntityIdRef.current = entity?.id || null;
    }, [entity?.id, formMode]);

    // Show OriginalForm for create mode
    if (formMode === "create") {
      return <OriginalForm showHeader={false} showReturnCheckbox={false} />;
    }

    if (!entity?.id) {
      return (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <AlertCircle className="mr-2 h-4 w-4" />
          Tidak ada chapter yang dipilih untuk diedit
        </div>
      );
    }

    // Handle form save and switch to editor tab
    const handleFormSave = async (formData: any) => {
      const dataToSave = { ...formData, id: entity?.id };
      await onSave(dataToSave, false);
      setActiveTab("editor");
    };

    // Custom footer with Edit Chapter button
    const customFooter = (
      <div className="flex justify-between items-center gap-2 max-w-[600px] w-full mx-auto">
        <div className="pl-2">
          <Button
            variant="destructive"
            onClick={() => entity && onDelete(entity)}
            disabled={_loading}
          >
            Hapus{" "}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setActiveTab("editor")} variant={"outline"}>
            Edit Konten
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              onClick={async () => {
                const form = document.querySelector("form") as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={_loading}
            >
              {_loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    );

    return (
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full h-full flex flex-col"
      >
        <TabsContent
          value="form"
          className="flex-1 mt-0 overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-auto p-6">
            <OriginalForm
              showHeader={false}
              showReturnCheckbox={false}
              showSubmit={false}
              className="relative w-full"
              onSave={handleFormSave}
            />
            <MonetizationEligibilityMessage />
            {customFooter}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="flex-1 mt-0">
          <ChapterEditor
            chapterId={entity.id}
            onSave={(content) => {
              onSave({ content, id: entity.id }, false);
            }}
            customButtons={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={_onCancel}
                  title="Kembali ke daftar chapter"
                  className="md:hidden"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Kembali</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("form")}
                  title="Edit judul dan detail chapter"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Edit Detail</span>
                </Button>
              </>
            }
          />
        </TabsContent>
      </Tabs>
    );
  };
