import type CSS from "csstype";
import React from "react";

interface TrxFilterTabsProps {
  current?: string;
  filter_stats?: Array<{ key: string; label: string; count: number }>;
  onFilterChange?: (filter: string) => void;
}

export const TrxFilterTabs = ({
  current = "semua",
  filter_stats = [],
  onFilterChange,
}: TrxFilterTabsProps) => {
  const defaultList = [
    { label: "Semua", value: "semua", color: "#3B2C93" },
    { label: "Berhasil", value: "berhasil", color: "#16A085" },
    { label: "Dibatalkan", value: "dibatalkan", color: "#E74C3C" },
    {
      label: "Menunggu Pembayaran",
      value: "menunggu_pembayaran",
      color: "#f39c12",
    },
    { label: "Kedaluwarsa", value: "kadaluwarsa", color: "#7f8c8d" },
    { label: "Ditolak", value: "ditolak", color: "#e84118" },
  ];

  const list =
    filter_stats.length > 0
      ? filter_stats.map((stat) => {
          const defaultItem = defaultList.find(
            (item) => item.value === stat.key
          );
          return {
            label: stat.label,
            value: stat.key,
            count: stat.count,
            color: defaultItem?.color || "#3B2C93",
          };
        })
      : defaultList.map((item) => ({ ...item, count: 0 }));

  const tabsCSS: CSS.Properties = {
    scrollbarWidth: "none" as any,
  };

  const renderTabs = list.map((item, index) => {
    const handleClick = (e: React.MouseEvent) => {
      if (onFilterChange) {
        e.preventDefault();
        onFilterChange(item.value);
      }
    };

    return (
      <a
        href={`/history?status=${item.value}`}
        onClick={handleClick}
        className={`${
          current === item.value
            ? `bg-[#3B2C93] text-white`
            : "text-gray-600 bg-gray-100 hover:bg-gray-200"
        } flex items-center px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap cursor-pointer transition-colors`}
        key={`esensi_trx_filtertabs_${index}`}
      >
        {item.label}
      </a>
    );
  });

  return (
    <div className="flex w-full items-center gap-4 p-4 bg-white border-b border-gray-200 rounded-sm">
      <div className="flex shrink-0 text-[#3B2C93] text-sm font-semibold uppercase">
        STATUS
      </div>
      <div className="flex w-auto gap-2 overflow-x-auto" style={tabsCSS}>
        {renderTabs}
      </div>
    </div>
  );
};
export default TrxFilterTabs;
