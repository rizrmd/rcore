import type CSS from "csstype";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShipmentFilterTabsProps {
  current?: string;
  filter_stats?: Array<{ key: string; label: string; count: number }>;
  onFilterChange?: (filter: string) => void;
}

export const ShipmentFilterTabs = ({
  current = "semua",
  filter_stats = [],
  onFilterChange,
}: ShipmentFilterTabsProps) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1000);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  const defaultList = [
    { label: "Semua", value: "semua", color: "#3B2C93" },
    { label: "Menunggu Konfirmasi", value: "pending", color: "#f39c12" },
    { label: "Menunggu Pembayaran", value: "unpaid", color: "#e84118" },
    { label: "Siap Dikirim", value: "waiting", color: "#8e44ad" },
    { label: "Dalam Pengiriman", value: "shipping", color: "#2980b9" },
    { label: "Telah Diterima", value: "delivered", color: "#16A085" },
    { label: "Dibatalkan", value: "canceled", color: "#c0392b" },
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
            color: defaultItem?.color || "#3B2C93", // Fallback color
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

    const isActive = current === item.value;

    return (
      <a
        href={`/shipment?status=${item.value}`}
        onClick={handleClick}
        style={isActive ? { backgroundColor: item.color } : {}}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap cursor-pointer transition-colors ${
          isActive
            ? "text-white"
            : "text-gray-600 bg-gray-100 hover:bg-gray-200"
        }`}
        key={`esensi_shipment_filtertabs_${index}`}
      >
        {item.label}
      </a>
    );
  });

  const currentItem = list.find((item) => item.value === current);

  return (
    <div className="flex w-full items-center gap-4 p-4 bg-white border-b border-gray-200 rounded-sm">
      <div className="flex shrink-0 text-[#3B2C93] text-sm font-semibold uppercase">
        STATUS
      </div>
      {isSmallScreen ? (
        <Select value={current} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[240px]">
            <SelectValue>
              {currentItem && (
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentItem.color }}
                  />
                  {currentItem.label}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {list.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex w-auto gap-2 overflow-x-auto" style={tabsCSS}>
          {renderTabs}
        </div>
      )}
    </div>
  );
};

export default ShipmentFilterTabs;