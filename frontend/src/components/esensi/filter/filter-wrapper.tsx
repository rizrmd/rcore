import React from "react";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { FilterItem } from "./filter-item";
import { PriceRangeFilter } from "./price-range-filter";
import { RatingFilter } from "./rating-filter";
import { filtersStore, toggleFilterPopup, clearAllFilters } from "@/lib/states/filters-store";

interface FilterWrapperProps {
  onFilterItem: (idx: number, value: any, single?: boolean) => void;
  onUpdateFilter: (closePopup?: boolean) => void;
}

export const FilterWrapper = ({ onFilterItem, onUpdateFilter }: FilterWrapperProps) => {
  const filtersState = useSnapshot(filtersStore);

  const handleFilterPopup = (e: any) => {
    e.preventDefault();
    toggleFilterPopup();
  };

  const renderFiltersWrapper = () => {
    const sections: React.ReactNode[] = [];

    filtersState.filters.forEach((filter, idx) => {
      let filterOptions: React.ReactNode;
      let section: React.ReactNode;
      if (!filtersState.skipFilters.includes(filter.name)) {
        if (filter.name == "sort") {
          const dropdwonlist = filter.options.map((o, oidx) => {
            return (
              <option value={o.value} key={`esensi_filter_sort_${oidx}`}>
                {o.label}
              </option>
            );
          });

          filterOptions = (
            <select
              className="w-full bg-[#E1E5EF] p-2 rounded-md"
              onChange={(e) => {
                e.preventDefault();
                onFilterItem(idx, e.target.value, true);
              }}
              value={filter.selected}
            >
              {dropdwonlist}
            </select>
          );
        } else {
          filterOptions = filter.options.map((o, oidx) => {
            return (
              <FilterItem
                pid={idx}
                label={o?.label}
                value={o?.value}
                action={onFilterItem}
                selected={filter.selected.includes(o.value)}
                key={`esensi_filter_${filter.name}__${oidx}`}
              />
            );
          });
        }

        section = (
          <div
            className="flex flex-col items-start w-full gap-2.5"
            key={`esensi_book_filter_${filter.name}_${idx}`}
          >
            <strong className="flex font-bold">{filter.label}</strong>
            <div className="flex w-full justify-start gap-1.5 lg:gap-2.5 flex-wrap lg:flex-col lg:items-start lg:px-1">
              {filterOptions}
            </div>
          </div>
        );
      }
      if (section) sections.push(section);
    });

    // Add price range filter
    if (!filtersState.skipFilters.includes("price")) {
      sections.push(
        <PriceRangeFilter key="price-filter" onUpdateFilter={onUpdateFilter} />
      );
    }

    // Add rating star filter
    if (!filtersState.skipFilters.includes("rating")) {
      sections.push(<RatingFilter key="rating-filter" />);
    }

    return sections;
  };

  return (
    <>
      <div
        className={`${
          filtersState.toggleFilter ? "flex" : "hidden"
        } lg:hidden bg-black fixed top-0 left-0 w-full h-full opacity-[.4] z-[65] lg:z-0`}
        onClick={handleFilterPopup}
      ></div>
      <div
        className={`flex flex-col fixed w-full h-auto max-h-2/3 lg:max-w-sm lg:w-auto lg:min-w-2xs gap-3 lg:gap-5 p-4 bottom-0 left-0 lg:top-0 rounded-t-3xl bg-white z-[65] lg:z-0 transition-transform ${
          filtersState.toggleFilter
            ? "translate-y-0"
            : "translate-y-full translate-x-0"
        } lg:translate-y-0 lg:translate-x-0 lg:relative lg:bottom-none lg:left-none lg:border-2 lg:border-indigo-200 lg:rounded-xl lg:p-6 lg:bg-gradient-to-br lg:from-indigo-50 lg:to-purple-50/80`}
      >
        <div className="flex flex-col w-full items-center gap-1 lg:items-start lg:border-b-2 lg:border-indigo-300/40 lg:pb-4 lg:mb-2">
          <hr className="hidden h-1 w-10 rounded-full border-4 border-[#3030C1]" />
          <strong className="flex font-semibold text-2xl lg:text-xl lg:text-indigo-700 lg:flex lg:items-center lg:gap-2">
            <SearchIcon
              className="hidden lg:block text-indigo-600"
              size={22}
            />
            Pencarian
          </strong>
          <p className="hidden lg:block text-sm text-indigo-600/80 mt-1 font-medium">
            Temukan buku yang Anda inginkan
          </p>
        </div>
        <div className="flex flex-col w-full gap-5 pb-3 overflow-y-auto lg:grow-1 lg:space-y-6">
          {renderFiltersWrapper()}
          <div className="flex w-full pt-3">
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                clearAllFilters();
                onUpdateFilter(true);
              }}
              className="bg-(--esensi-color) text-(--esensi-color-i) hover:bg-(--esensi-color-alt)"
            >
              Bersihkan Filter
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};export default FilterWrapper;
