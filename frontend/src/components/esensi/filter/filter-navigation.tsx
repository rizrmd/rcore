import React from "react";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/button";
import { ListFilter, Loader2 } from "lucide-react";
import { filtersStore, toggleFilterPopup } from "@/lib/states/filters-store";

interface FilterNavigationProps {
  onRemoveFilter: (filterName: string, value?: string) => void;
  loading?: boolean;
}

export const FilterNavigation = ({ onRemoveFilter, loading = false }: FilterNavigationProps) => {
  const filtersState = useSnapshot(filtersStore);

  const handleFilterPopup = (e: any) => {
    e.preventDefault();
    toggleFilterPopup();
  };

  const getSelectedFilterButtons = () => {
    const allButtons: React.JSX.Element[] = [];

    filtersState.selectedFilters.forEach((selectedFilter) => {
      allButtons.push(
        <Button
          key={`selected-${selectedFilter.filterName}-${selectedFilter.value}`}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-xs px-2 py-1 h-auto bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          onClick={() =>
            onRemoveFilter(selectedFilter.filterName, selectedFilter.value)
          }
        >
          {selectedFilter.label}
          <span className="ml-1 text-blue-500">×</span>
        </Button>
      );
    });

    return allButtons;
  };

  return (
    <div className="flex justify-start items-center flex-wrap w-full gap-x-3 gap-y-1.5">
      <Button
        variant="link"
        className="flex shrink-0 items-center justify-center gap-2 bg-[#EFEFEF] rounded-sm pl-4 pr-4"
        onClick={handleFilterPopup}
      >
        <ListFilter strokeWidth={1.5} color="#3030C1" />
        <span className="flex text-[#383D64]">Filter</span>
      </Button>
      <div className="flex w-px h-7 bg-[#9c9c9c] shrink-0"></div>
      {filtersState.selectedFilters.length > 0 ? (
        getSelectedFilterButtons()
      ) : loading ? (
        <div className="flex items-center gap-2 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <div className="text-xs">Klik Filter untuk pencarian spesifik</div>
      )}
    </div>
  );
};export default FilterNavigation;
