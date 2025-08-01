import type { ItemLayoutEnum } from "@/lib/utils";
import { useEffect } from "react";
import { LayoutToggle } from "../ext/layout-toggle";

interface DataPaginationProps {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => Promise<void> | void;
  onLimitChange: (limit: number) => Promise<void> | void;
  onReload: () => Promise<void> | void;
  updateUrl?: boolean;
  layout?: ItemLayoutEnum;
  onLayoutChange?: (value: ItemLayoutEnum) => void;
}

export function DataPagination({
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
  onReload,
  updateUrl = true,
  layout,
  onLayoutChange,
}: DataPaginationProps) {
  useEffect(() => {
    if (updateUrl) {
      // Update URL with pagination params
      const url = new URL(window.location.href);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      window.history.replaceState({}, "", url.toString());
    }
  }, [page, limit, updateUrl]);

  return (
    <div className="w-full md:w-auto flex flex-col md:flex-row gap-4 items-center">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={async () => {
              if (onReload) await onReload();
            }}
            title="Muat ulang data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-primary"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Total: <span className="text-primary font-semibold">{total}</span>
          </span>
        </div>
        {total > limit && (
          <>
            <div className="h-8 border-r border-gray-200 hidden sm:block border-3"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Tampilkan</span>
              <select
                value={limit}
                onChange={async (e) => {
                  const newLimit = parseInt(e.target.value);
                  onLimitChange(newLimit);
                }}
                className="h-8 rounded-md border border-gray-200 text-sm px-2 py-0 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </>
        )}
      </div>
      {total > limit && (
        <>
          <div className="h-8 border-r border-gray-200 hidden md:block border-3"></div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-sm text-gray-500">Halaman</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={async () => {
                  if (page > 1) {
                    onPageChange(page - 1);
                  }
                }}
                className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <select
                value={page}
                onChange={async (e) => {
                  const newPage = parseInt(e.target.value);
                  onPageChange(newPage);
                }}
                className="h-8 w-16 rounded-md border border-gray-200 text-sm px-2 py-0 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <option key={pageNum} value={pageNum}>
                      {pageNum}
                    </option>
                  )
                )}
              </select>

              <button
                disabled={page === totalPages}
                onClick={async () => {
                  if (page < totalPages) {
                    onPageChange(page + 1);
                  }
                }}
                className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <span className="text-sm text-gray-500">dari {totalPages}</span>
          </div>
        </>
      )}
      {layout && onLayoutChange && (
        <LayoutToggle layout={layout} onLayoutChange={onLayoutChange} />
      )}
    </div>
  );
}
