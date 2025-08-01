import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { EFilter } from "../../elist/efilter";
import { ETable } from "../../elist/etable";
import { css } from "goober";
import { useSnapshot } from "valtio";
import { useEffect, useState, useRef, useCallback } from "react";
import type {
  BaseEntity,
  BreadcrumbItem,
  ColumnConfig,
  CRUDConfig,
} from "../types";

interface ECrudListViewProps<T extends BaseEntity> {
  config: CRUDConfig<T>;
  state: any; // The valtio proxy state
  breadcrumbs: BreadcrumbItem[];
  displayMode?: "table" | "card" | "compact" | "header-only" | "content-only";
  onSort: (field: keyof T) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onLoadMore?: () => void;
  onFilterApply: (filters: any) => void;
  onFilterReset: () => void;
  onRemoveFilter: (key: string) => void;
  onEntityCreate: () => void;
  onEntitySelect: (entity: T) => void;
  onEntityView: (entity: T) => void;
  onEntityDelete: (entity: T) => void;
  onEntityRestore: (entity: T) => void;
  onBulkDelete: () => void;
  onBulkRestore: () => void;
  onBulkSelectionChange: (selectedIds: (string | number)[]) => void;
  onSelectAllRecords: () => void;
  onClearSelection: () => void;
  onToggleTrash: () => void;
  onRefresh: () => void;
  onBreadcrumbClick: (url: string) => void;
  hasLoadAllIds: boolean;
  apiFunction?: any; // For relation filters
  customActions?: {
    list?: (props: {
      entity: T;
      entities: T[];
      selectedIds: (string | number)[];
      actions: {
        refresh: () => void;
        create: () => void;
        edit: (entity: T) => void;
        delete: (entity: T) => void;
        view: (entity: T) => void;
        bulkDelete: (ids: (string | number)[]) => void;
      };
    }) => React.ReactNode;
  };
}

export const ECrudListView = <T extends BaseEntity>({
  config,
  state,
  breadcrumbs,
  displayMode = "table",
  apiFunction,
  onSort,
  onPageChange,
  onPageSizeChange,
  onLoadMore,
  onFilterApply,
  onFilterReset,
  onRemoveFilter,
  onEntityCreate,
  onEntitySelect,
  onEntityView,
  onEntityDelete,
  onEntityRestore,
  onBulkDelete,
  onBulkRestore,
  onBulkSelectionChange,
  onSelectAllRecords,
  onClearSelection,
  onToggleTrash,
  onRefresh,
  onBreadcrumbClick,
  hasLoadAllIds,
  customActions,
}: ECrudListViewProps<T>) => {
  const read = useSnapshot(state);

  // State to store resolved relation labels for filters
  const [resolvedFilterLabels, setResolvedFilterLabels] = useState<
    Record<string, string>
  >({});

  // Infinite scroll setup
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInfiniteScroll = displayMode === "compact" && onLoadMore;
  const hasMoreData = read.pagination.page < read.pagination.totalPages;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!isInfiniteScroll || !hasMoreData || read.loading.list) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && onLoadMore && hasMoreData) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [isInfiniteScroll, hasMoreData, read.loading.list, onLoadMore]);

  // Function to resolve relation filter labels
  const resolveRelationLabel = async (filterKey: string, value: string) => {
    const filter = config.filters.find((f) => f.key === filterKey);
    if (
      !filter ||
      filter.type !== "relation" ||
      !filter.relationConfig ||
      !apiFunction
    ) {
      return value;
    }

    try {
      const params: any = {
        action: "nested_list",
        nested_model: filter.relationConfig.model,
        parent_id: "filter",
        search: "",
        page: 1,
        limit: 1,
        fields: filter.relationConfig.labelFields.join(","),
      };

      // Add the specific value we're looking for
      params.id = value;

      const response = await apiFunction(params);

      if (response.success && response.data && response.data.length > 0) {
        const item = response.data[0];
        const label = filter.relationConfig.renderLabel(item);
        return label;
      }
    } catch (error) {
      console.error(
        `Failed to resolve relation label for ${filterKey}:`,
        error
      );
    }

    return value; // Fallback to original value
  };

  // Effect to resolve relation labels when filters change
  useEffect(() => {
    const resolveLabels = async () => {
      const newLabels: Record<string, string> = {};

      for (const [key, value] of Object.entries(read.filters)) {
        const filter = config.filters.find((f) => f.key === key);
        if (filter?.type === "relation" && value) {
          const label = await resolveRelationLabel(key, String(value));
          newLabels[key] = label;
        }
      }

      setResolvedFilterLabels(newLabels);
    };

    if (Object.keys(read.filters).length > 0) {
      resolveLabels();
    } else {
      setResolvedFilterLabels({});
    }
  }, [read.filters, config.filters, apiFunction]);

  // Helper function to format dates in Indonesian locale
  const formatDateIndonesian = (dateValue: any): string => {
    if (!dateValue) return "";

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return String(dateValue);

      // Check if it's a date-only value (time is 00:00:00)
      const isDateOnly =
        date.getHours() === 0 &&
        date.getMinutes() === 0 &&
        date.getSeconds() === 0;

      if (isDateOnly) {
        // Format as date only: "31 Desember 2023"
        return date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } else {
        // Format as datetime: "31 Desember 2023, 14:30"
        return date
          .toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replaceAll(" pukul", " -");
      }
    } catch (error) {
      return String(dateValue);
    }
  };

  const getTableColumns = (): ColumnConfig<T>[] => {
    const baseColumns: ColumnConfig<T>[] = config.columns.map((col) => {
      let render = col.render;

      // If column has relationConfig, create a render function that resolves the relation
      if (col.relationConfig && !col.render) {
        render = ({ value, entity }: { value: any; entity: T; isSelected?: boolean }) => {
          if (!value) return "No selection";

          if (col.relationConfig?.renderLabel) {
            // Look for the related data in the entity using the model name
            const relationData = (entity as any)[col.relationConfig.model];

            // Handle array of relations (find by ID)
            if (Array.isArray(relationData)) {
              const relatedItem = relationData.find(
                (item: any) => item.id === value
              );
              if (relatedItem) {
                return col.relationConfig.renderLabel(relatedItem);
              }
            }
            // Handle direct relation object
            else if (relationData && relationData.id === value) {
              return col.relationConfig.renderLabel(relationData);
            }
          }

          return `ID: ${value}`;
        };
      }

      // Add automatic date/datetime formatting for columns that contain date/time values
      if (!render) {
        const columnKey = String(col.key);
        const isDateColumn =
          columnKey.includes("date") ||
          columnKey.includes("time") ||
          columnKey.includes("created_at") ||
          columnKey.includes("updated_at") ||
          columnKey.includes("deleted_at") ||
          columnKey.includes("published_date");

        if (isDateColumn) {
          render = (value: any) => formatDateIndonesian(value);
        }
      }

      return {
        key: col.key,
        label: col.label,
        sortable: col.sortable,
        width: col.width,
        align: col.align,
        render,
        className: col.className,
        hidden: col.hidden,
        minWidth: col.minWidth,
        maxWidth: col.maxWidth,
        noWrap: col.noWrap,
        ellipsis: col.ellipsis,
        hiddenOnMobile: col.hiddenOnMobile,
      };
    });

    if (
      config.actions?.list?.edit !== false ||
      config.actions?.list?.delete !== false ||
      config.actions?.list?.restore !== false ||
      (read.showTrash && config.actions?.list?.view !== false)
    ) {
      baseColumns.push({
        key: "actions" as keyof T,
        label: "Actions",
        width: "120px",
        className: "p-2 font-semibold text-sm flex items-center justify-center",
        render: ({ entity: row }: { value: any; entity: T; isSelected?: boolean }) => (
          <div className="flex items-center gap-2 justify-center">
            {read.showTrash ? (
              <>
                {config.actions?.list?.view !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEntityView(row)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </Button>
                )}
                {config.actions?.list?.edit !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEntitySelect(row)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Button>
                )}
                {config.actions?.list?.restore !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEntityRestore(row)}
                    disabled={read.loading.restore}
                    title="Restore"
                  >
                    <RotateCcw size={16} />
                  </Button>
                )}
              </>
            ) : (
              <>
                {config.actions?.list?.edit !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEntitySelect(row)}
                  >
                    <Edit size={16} />
                  </Button>
                )}
                {config.actions?.list?.delete !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEntityDelete(row)}
                    disabled={read.loading.delete}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        ),
      });
    }

    return baseColumns;
  };

  const tableColumns = getTableColumns();
  const tableData = [...read.entities] as T[];
  const sortingData = {
    field: read.sorting.field as keyof T | null,
    direction: read.sorting.direction,
  };
  
  const bulkSelectionConfig = config.actions?.list?.bulkSelect
    ? {
        enabled: true,
        selectedIds: [...read.bulkSelection.selectedIds],
        onSelectionChange: onBulkSelectionChange,
        allRecordsSelected: read.bulkSelection.allRecordsSelected,
      }
    : undefined;

  const breadLen = breadcrumbs.length;

  // Header component
  const HeaderComponent = () => (
    <CardHeader className="flex-none">
        <div className={cn(
          "flex flex-col md:flex-row gap-3",
          displayMode === "compact" ? "gap-4" : ""
        )}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {breadLen > 0 ? (
              <Breadcrumbs data={breadcrumbs} onClick={onBreadcrumbClick} />
            ) : (
              <CardTitle className={cn(
                "flex flex-col gap-2 sm:flex-row sm:items-center",
                displayMode === "compact" ? "text-lg" : ""
              )}>
                <span>
                  {config.entityNamePlural || `${config.entityName}s`}
                </span>
                {config.actions?.list?.bulkSelect &&
                  read.bulkSelection.selectedIds.length > 0 && (
                    <Badge variant="secondary">
                      {read.bulkSelection.selectedIds.length} selected
                      {read.bulkSelection.allRecordsSelected &&
                        " (all records)"}
                    </Badge>
                  )}
              </CardTitle>
            )}
          </div>
          <div className={cn(
            "flex flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto",
            displayMode === "compact" ? "gap-3" : ""
          )}>
            {config.actions?.list?.bulkSelect &&
              read.bulkSelection.selectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearSelection}
                    disabled={
                      read.loading.bulkDelete || read.loading.bulkRestore
                    }
                    className="flex-shrink-0"
                  >
                    Batal
                  </Button>
                  {read.showTrash ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onBulkRestore}
                      disabled={read.loading.bulkRestore}
                      className="flex-shrink-0"
                    >
                      {read.loading.bulkRestore && (
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                      )}
                      <RotateCcw size={16} className="mr-2" />
                      Pulihkan ({read.bulkSelection.selectedIds.length})
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onBulkDelete}
                      disabled={read.loading.bulkDelete}
                      className="flex-shrink-0"
                    >
                      {read.loading.bulkDelete && (
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                      )}
                      <Trash2 size={16} className="mr-2" />
                      Hapus ({read.bulkSelection.selectedIds.length})
                    </Button>
                  )}
                </>
              )}
            {config.actions?.list?.bulkSelect &&
              read.bulkSelection.selectedIds.length > 0 &&
              !read.bulkSelection.allRecordsSelected &&
              hasLoadAllIds && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="border flex-shrink-0"
                  onClick={onSelectAllRecords}
                  disabled={
                    read.bulkSelection.isSelectingAll || read.loading.bulkDelete
                  }
                >
                  {read.bulkSelection.isSelectingAll && (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                  )}
                  Semua ({read.totalCount})
                </Button>
              )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={read.loading.list}
              className="flex-shrink-0"
            >
              <RefreshCw
                size={16}
                className={read.loading.list ? "animate-spin" : ""}
              />
            </Button>
            {config.actions?.list?.filter !== false && (
              <EFilter
                filters={config.filters}
                values={read.filters}
                onApply={onFilterApply}
                onReset={onFilterReset}
                onRemoveFilter={onRemoveFilter}
                apiFunction={apiFunction}
                compact={displayMode === "compact"}
              />
            )}
            {!read.showTrash && (
              customActions?.list ? (
                customActions.list({
                  entity: read.selectedEntity as T,
                  entities: read.entities as T[],
                  selectedIds: read.selectedIds,
                  actions: {
                    refresh: onRefresh,
                    create: onEntityCreate,
                    edit: (entity: T) => onEntitySelect(entity),
                    delete: onEntityDelete,
                    view: onEntityView,
                    bulkDelete: onBulkDelete,
                  },
                })
              ) : config.actions?.list?.create !== false ? (
                <Button size="sm" onClick={onEntityCreate} className="flex-shrink-0">
                  <Plus size={16} className={displayMode === "compact" ? "" : "mr-2"} />
                  {displayMode !== "compact" && (
                    <>
                      <span className="hidden sm:inline">Tambah {config.entityName}</span>
                      <span className="sm:hidden">Tambah</span>
                    </>
                  )}
                </Button>
              ) : null
            )}
            {config.actions?.list?.viewTrash && config.softDelete?.enabled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-shrink-0">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onToggleTrash}>
                    <Trash2 size={16} className="mr-2" />
                    {read.showTrash ? "Lihat Aktif" : "Lihat Data Terhapus"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {config.actions?.list?.filter !== false &&
          Object.keys(read.filters).length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Filter Data:</span>
              {Object.entries(read.filters).map(([key, value]) => {
                const filter = config.filters.find((f) => f.key === key);
                const displayValue =
                  filter?.type === "relation" && resolvedFilterLabels[key]
                    ? resolvedFilterLabels[key]
                    : String(value);

                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1 py-1 hover:border-black/20 border border-transparent cursor-default"
                  >
                    {filter?.label}: {displayValue}
                    <button
                      onClick={() => onRemoveFilter(key)}
                      className="ml-1 hover:text-destructive cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
    </CardHeader>
  );

  // Content component
  const ContentComponent = () => (
    <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          {displayMode === "table" ? (
            <ETable
              data={tableData}
              columns={tableColumns as any}
              loading={read.loading.list}
              sorting={sortingData}
              onSort={onSort}
              selectedEntity={read.selectedEntity}
              bulkSelection={bulkSelectionConfig}
              className={cn(
                read.loading.list && "pointer-events-none opacity-60"
              )}
            />
          ) : displayMode === "card" ? (
            <div className={cn(
              "space-y-3 overflow-y-auto",
              read.loading.list && "pointer-events-none opacity-60"
            )}>
              {tableData.length === 0 && !read.loading.list ? (
                <div className="flex items-center justify-center p-8 text-gray-500">
                  <p>Tidak ada data untuk ditampilkan</p>
                </div>
              ) : (
                tableData.map((entity) => {
                  // Check if we have a custom renderRow function
                  if (config.renderRow) {
                    return (
                      <div key={entity.id} className="bg-white border rounded-lg hover:shadow-md transition-shadow">
                        {config.renderRow({
                          entity,
                          isSelected: read.selectedEntity?.id === entity.id,
                          onClick: () => onEntitySelect(entity),
                        })}
                      </div>
                    );
                  }
                  
                  // Fall back to column-based rendering
                  return (
                <div
                  key={entity.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onEntitySelect(entity)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      {config.columns
                        .filter(col => !col.hidden && col.key !== 'actions')
                        .slice(0, 3)
                        .map((col) => {
                        const value = entity[col.key];
                        let displayValue;
                        
                        if (col.render) {
                          // Use custom render function if provided
                          try {
                            const rendered = col.render({ value, entity, isSelected: read.selectedEntity?.id === entity.id });
                            // Handle cases where render function returns null/undefined/empty
                            displayValue = rendered ?? '-';
                          } catch (error) {
                            console.error(`Error rendering column ${String(col.key)}:`, error);
                            displayValue = '-';
                          }
                        } else {
                          // Check if this is a date column by looking at the column key name
                          const columnKey = String(col.key);
                          const isDateColumn = columnKey.includes('date') || 
                                             columnKey.includes('time') || 
                                             columnKey.includes('created_at') || 
                                             columnKey.includes('updated_at') || 
                                             columnKey.includes('deleted_at');
                          
                          if (isDateColumn && value) {
                            displayValue = formatDateIndonesian(value);
                          } else {
                            displayValue = String(value || '-');
                          }
                        }
                        return (
                          <div key={String(col.key)} className="mb-1 flex items-start">
                            <span className="text-xs text-gray-500">{col.label}:</span>
                            <span className="ml-2 text-sm flex-1">{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-1">
                      {config.actions?.list?.edit !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntitySelect(entity);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                      )}
                      {config.actions?.list?.delete !== false && !read.showTrash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntityDelete(entity);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                      {read.showTrash && config.actions?.list?.restore !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntityRestore(entity);
                          }}
                        >
                          <RotateCcw size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className={cn(
              "space-y-1 overflow-y-auto",
              read.loading.list && "pointer-events-none opacity-60"
            )}>
              {tableData.map((entity) => {
                // Use custom renderRow if provided
                if (config.renderRow) {
                  return (
                    <div key={entity.id}>
                      {config.renderRow({ 
                        entity, 
                        isSelected: read.selectedEntity?.id === entity.id,
                        onClick: () => onEntitySelect(entity)
                      })}
                    </div>
                  );
                }

                // Default compact row rendering
                const visibleColumns = config.columns.filter(col => 
                  col.key !== 'id' && 
                  col.key !== 'actions' && 
                  !col.hidden
                );
                const primaryCol = visibleColumns[0] || config.columns[0];
                const secondaryCol = visibleColumns[1];
                
                const primaryValue = primaryCol?.render 
                  ? primaryCol.render({ value: entity[primaryCol.key], entity, isSelected: read.selectedEntity?.id === entity.id }) 
                  : String(entity[primaryCol?.key] || '-');
                const secondaryValue = secondaryCol 
                  ? (secondaryCol.render 
                      ? secondaryCol.render({ value: entity[secondaryCol.key], entity, isSelected: read.selectedEntity?.id === entity.id }) 
                      : String(entity[secondaryCol.key] || '-')
                    ) 
                  : null;
                
                return (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => onEntitySelect(entity)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{primaryValue}</div>
                      {secondaryValue && (
                        <div className="text-xs text-gray-500 truncate">{secondaryValue}</div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {config.actions?.list?.view !== false && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEntityView(entity);
                            }}
                          >
                            <Eye size={14} className="mr-2" />
                            Lihat
                          </DropdownMenuItem>
                        )}
                        {config.actions?.list?.edit !== false && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEntitySelect(entity);
                            }}
                          >
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {config.actions?.list?.delete !== false && !read.showTrash && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEntityDelete(entity);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        )}
                        {read.showTrash && config.actions?.list?.restore !== false && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEntityRestore(entity);
                            }}
                          >
                            <RotateCcw size={14} className="mr-2" />
                            Pulihkan
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {config.actions?.list?.pagination !== false && read.totalCount > 0 && !isInfiniteScroll && (
          <div className="flex gap-4 flex-row sm:items-center sm:justify-between mt-4 flex-none">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <span className="text-sm text-gray-600 whitespace-nowrap lg:flex hidden">
                Tampilkan
              </span>
              <Select
                value={read.pagination.pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-20 lg:flex hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600 whitespace-nowrap lg:flex hidden">
                per halaman
              </span>
              {read.totalCount > 0 && (
                <span className="text-sm text-gray-600 border-l ml-1 pl-3 whitespace-nowrap lg:flex hidden">
                  Total: {read.totalCount.toLocaleString("id-ID")} data
                </span>
              )}

              <Select
                value={read.pagination.pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
              >
                <SelectTrigger
                  className={cn(
                    "min-h-[60px] h-[60px] flex justify-start lg:hidden pr-0",
                    css`
                      svg {
                        display: none;
                      }
                    `
                  )}
                >
                  <div className="text-sm text-gray-600 whitespace-nowrap flex-1 flex-col flex items-start">
                    <span>
                      Per Halaman:{" "}
                      {read.pagination.pageSize.toLocaleString("id-ID")} data
                    </span>
                    {read.totalCount > 0 && (
                      <span>
                        Total: {read.totalCount.toLocaleString("id-ID")} data
                      </span>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {read.pagination.totalPages > 1 && (
              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(read.pagination.page - 1)}
                  disabled={read.pagination.page <= 1}
                >
                  <ChevronLeft />
                </Button>
                <span className="text-sm whitespace-nowrap lg:flex hidden">
                  Halaman {read.pagination.page} dari{" "}
                  {read.pagination.totalPages}
                </span>
                <span className="text-sm whitespace-nowrap lg:hidden flex">
                  {read.pagination.page} / {read.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(read.pagination.page + 1)}
                  disabled={read.pagination.page >= read.pagination.totalPages}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Infinite Scroll Load More Trigger */}
        {isInfiniteScroll && (
          <div className="mt-4">
            {hasMoreData && (
              <div 
                ref={loadMoreRef}
                className="flex items-center justify-center p-4"
              >
                {read.loading.list ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading more...
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    Scroll to load more ({read.entities.length} of {read.totalCount})
                  </div>
                )}
              </div>
            )}
            {!hasMoreData && read.entities.length > 0 && (
              <div className="flex items-center justify-center p-4">
                <div className="text-sm text-gray-500">
                  All {read.totalCount} items loaded
                </div>
              </div>
            )}
          </div>
        )}
    </CardContent>
  );

  // Conditional rendering based on displayMode
  if (displayMode === "header-only") {
    return <HeaderComponent />;
  }
  
  if (displayMode === "content-only") {
    return <ContentComponent />;
  }
  
  // Default: render both header and content
  return (
    <>
      <HeaderComponent />
      <ContentComponent />
    </>
  );
};
