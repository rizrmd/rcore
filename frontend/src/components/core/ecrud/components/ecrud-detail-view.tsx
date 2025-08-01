import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { useSnapshot } from "valtio";
import type {
  BaseEntity,
  BreadcrumbItem,
  CRUDConfig,
  FormFieldConfig,
} from "../types";

interface ECrudDetailViewProps<T extends BaseEntity> {
  config: CRUDConfig<T>;
  state: any; // The valtio proxy state
  breadcrumbs: BreadcrumbItem[];
  onBreadcrumbClick: (url: string) => void;
  onNavigateToPrevious: () => void;
  onNavigateToNext: () => void;
  navigationInfo: {
    currentPosition: number;
    totalCount: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}

export const ECrudDetailView = <T extends BaseEntity>({
  config,
  state,
  breadcrumbs,
  onBreadcrumbClick,
  onNavigateToPrevious,
  onNavigateToNext,
  navigationInfo,
}: ECrudDetailViewProps<T>) => {
  const read = useSnapshot(state);

  const getFormFields = (): FormFieldConfig<T>[] => {
    if (typeof config.formFields === "function") {
      return config.formFields({
        showTrash: read.showTrash,
        formMode: read.formMode,
      });
    }
    return config.formFields;
  };

  const formatValue = (field: FormFieldConfig<T>, value: any) => {
    if (!value && value !== 0) return "-";

    switch (field.type) {
      case "datetime":
        return new Date(value).toLocaleString("id-ID");
      case "date":
        return new Date(value).toLocaleDateString("id-ID");
      case "checkbox":
        return value ? "Ya" : "Tidak";
      case "select":
        const option = field.options?.find((opt) => opt.value === value);
        return option?.label || value;
      default:
        return value;
    }
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {breadcrumbs.length > 0 ? (
              <Breadcrumbs data={breadcrumbs} onClick={onBreadcrumbClick} />
            ) : (
              <CardTitle>{config.entityName} Detail</CardTitle>
            )}
          </div>
          {navigationInfo.totalCount > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {navigationInfo.currentPosition} of {navigationInfo.totalCount}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToPrevious}
                  disabled={!navigationInfo.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToNext}
                  disabled={!navigationInfo.hasNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-auto relative flex-1 ">
        <div className="space-y-4 absolute flex inset-0 flex-col px-4">
          {getFormFields().map((field) => {
            const value = read.selectedEntity
              ? (read.selectedEntity as any)[field.name]
              : null;
            return (
              <div
                key={field.name as string}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div className="font-medium text-gray-700">{field.label}:</div>
                <div className="sm:col-span-2">{formatValue(field, value)}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </>
  );
};
