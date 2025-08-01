import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { css } from "goober";
import { BookMarked, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { proxy, useSnapshot } from "valtio";

export interface BaseEntity {
  id?: string | number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (args: { value: any; entity: T; isSelected?: boolean }) => ReactNode;
  className?: string;
  hidden?: boolean;
}

interface ETableState<T> {
  columns: ColumnConfig<T>[];
  scrollbarWidth: number;
  bodyWidth: number;
}

export const ETable = <T extends BaseEntity>(opt: {
  data: T[];
  columns: ColumnConfig<T>[];
  className?: string;
  loading?: boolean;
  sorting?: {
    field: keyof T | null;
    direction: "asc" | "desc" | null;
  };
  onSort?: (field: keyof T) => void;
  selectedEntity?: T | null;
  bulkSelection?: {
    enabled: boolean;
    selectedIds: (string | number)[];
    onSelectionChange: (selectedIds: (string | number)[]) => void;
    allRecordsSelected?: boolean;
  };
}) => {
  const write = useRef(
    proxy<ETableState<T>>({
      columns: opt.columns,
      scrollbarWidth: 0,
      bodyWidth: 0,
    })
  ).current;
  const read = useSnapshot(write);

  // Ref for the scrollable body container
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const bodyInnerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to check and update scrollbar width and header width
  const updateScrollbarWidth = () => {
    // Calculate base scrollbar width (what the system uses when scrollbars are present)
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll";
    document.body.appendChild(outer);

    const inner = document.createElement("div");
    outer.appendChild(inner);

    const systemScrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    document.body.removeChild(outer);

    // Check if there's actually a scrollbar in the body container
    const hasVerticalScrollbar = bodyContainerRef.current
      ? bodyContainerRef.current.scrollHeight >
        bodyContainerRef.current.clientHeight
      : false;

    // Only use scrollbar width if there's actually a scrollbar
    const newScrollbarWidth = hasVerticalScrollbar ? systemScrollbarWidth : 0;

    if (write.scrollbarWidth !== newScrollbarWidth) {
      write.scrollbarWidth = newScrollbarWidth;
    }

    if (bodyInnerRef.current) {
      const ref = containerRef.current;
      if (ref && bodyInnerRef.current) {
        setTimeout(() => {
          if (bodyInnerRef.current)
            ref.style.width = `${bodyInnerRef.current!.scrollWidth}px`;
        });
      }
    }
  };

  // Update scrollbar width when data changes
  useEffect(() => {
    // Use a small timeout to ensure DOM has been updated after data change
    const timeoutId = setTimeout(updateScrollbarWidth, 10);
    return () => clearTimeout(timeoutId);
  }, [opt.data]);

  // Update scrollbar width when container size changes
  useEffect(() => {
    const container = bodyContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollbarWidth();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    write.columns = opt.columns;
  }, [opt.columns]);

  const handleSelectAll = (checked: boolean) => {
    if (!opt.bulkSelection) return;

    if (checked) {
      const allIds = opt.data
        .map((item) => item.id)
        .filter((id): id is string | number => id !== undefined);
      opt.bulkSelection.onSelectionChange(allIds);
    } else {
      opt.bulkSelection.onSelectionChange([]);
    }
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    if (!opt.bulkSelection) return;

    let newSelection = [...opt.bulkSelection.selectedIds];
    if (checked) {
      newSelection.push(id);
    } else {
      newSelection = newSelection.filter((selectedId) => selectedId !== id);
    }
    opt.bulkSelection.onSelectionChange(newSelection);
  };

  const selectedLen = opt.bulkSelection?.selectedIds.length || 0;
  const isAllSelected =
    opt.bulkSelection?.allRecordsSelected ||
    (selectedLen === opt.data.length && opt.data.length > 0);
  const isIndeterminate =
    selectedLen > 0 &&
    selectedLen < opt.data.length &&
    !opt.bulkSelection?.allRecordsSelected;

  const totalColumns =
    read.columns.length + (opt.bulkSelection?.enabled ? 1 : 0);

  const rowTemplateColumns = [
    ...(opt.bulkSelection?.enabled ? ["50px"] : []),
    ...read.columns.map((col) => {
      if (col.width)
        return typeof col.width === "number" ? `${col.width}px` : col.width;
      // Use minmax with 1fr to fill available space while maintaining minimum width
      return "minmax(150px, 1fr)";
    }),
  ].join(" ");

  const headTemplateColumns = [
    ...(opt.bulkSelection?.enabled ? ["50px"] : []),
    ...read.columns.map((col, idx) => {
      const isLastColumn = idx === read.columns.length - 1;
      if (col.width) {
        const width =
          typeof col.width === "number" ? col.width : parseInt(col.width) || 50;
        return isLastColumn
          ? `${width + read.scrollbarWidth}px`
          : typeof col.width === "number"
          ? `${col.width}px`
          : col.width;
      }
      // Use minmax with 1fr to fill available space while maintaining minimum width
      return isLastColumn
        ? `calc(minmax(150px, 1fr) + ${read.scrollbarWidth}px)`
        : "minmax(150px, 1fr)";
    }),
  ].join(" ");

  return (
    <div
      className={cn(
        "flex flex-col border relative rounded-lg overflow-x-scroll overflow-y-hidden h-full",
        opt.className
      )}
    >
      {read.columns.length > 0 && (
        <div
          className={cn("flex flex-col h-full absolute inset-0 items-stretch")}
          ref={containerRef}
        >
          {/* Header */}
          <div
            className={cn("bg-background-alt border-b grid grid-col w-full")}
            style={{ gridTemplateColumns: headTemplateColumns }}
          >
            {opt.bulkSelection?.enabled && (
              <div className="p-2 flex items-center justify-center">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
                  {...(isIndeterminate && { "data-state": "indeterminate" })}
                />
              </div>
            )}
            {read.columns.map((col, index) => (
              <div
                key={col.key as string}
                className={cn(
                  "p-2 font-semibold select-none text-sm text-left flex items-center",
                  col.align === "center" && "justify-center",
                  col.align === "right" && "justify-end",
                  col.className,
                  col.sortable &&
                    opt.onSort &&
                    "cursor-pointer hover:bg-gray-100"
                )}
                onClick={() => {
                  if (col.sortable && opt.onSort) {
                    opt.onSort(col.key as keyof T);
                  }
                }}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    col.align === "center" && "justify-center",
                    col.align === "right" && "justify-end"
                  )}
                >
                  <span className="whitespace-nowrap">{col.label}</span>
                  {col.sortable && (
                    <div className="flex items-center">
                      {opt.sorting?.field === col.key &&
                      opt.sorting.direction ? (
                        opt.sorting.direction === "asc" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <></>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Body Container */}
          <div
            ref={bodyContainerRef}
            className={cn(
              "flex-1 relative w-full overflow-y-auto overflow-x-scroll"
            )}
          >
            {opt.data.length > 0 ? (
              <div className="absolute inset-0" ref={bodyInnerRef}>
                {opt.data.map((row, index) => (
                  <div
                    key={row.id}
                    className={cn(
                      "grid hover:bg-muted/50 transition-colors",
                      index > 0 && "border-t border-gray-200"
                    )}
                    style={{ gridTemplateColumns: rowTemplateColumns }}
                  >
                    {opt.bulkSelection?.enabled && (
                      <div key={`${row.id}-checkbox`} className="p-2 flex items-center justify-center">
                        <Checkbox
                          checked={opt.bulkSelection.selectedIds.includes(
                            row.id as string | number
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectItem(
                              row.id as string | number,
                              checked as boolean
                            )
                          }
                        />
                      </div>
                    )}
                    {read.columns.map((col) => (
                      <div
                        key={`${row.id}-${col.key as string}`}
                        className={cn(
                          "p-2 text-sm flex items-center",
                          col.align === "center" && "justify-center",
                          col.align === "right" && "justify-end",
                          col.className
                        )}
                      >
                        <div className="w-full overflow-hidden">
                          <div className="truncate">
                            {col.render
                              ? col.render({ value: row[col.key as keyof T], entity: row, isSelected: opt.selectedEntity?.id === row.id || (row.id ? opt.bulkSelection?.selectedIds.includes(row.id) : false) })
                              : (row[col.key as keyof T] as ReactNode)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="grid p-4 text-gray-500"
                style={{ gridTemplateColumns: rowTemplateColumns }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ gridColumn: `1 / ${totalColumns + 1}` }}
                >
                  {opt.loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <BookMarked size={16} />
                      Tidak Ditemukan
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
