import { useSnapshot } from "valtio";
import { Input } from "@/components/ui/input";
import {
  defaultMaxPrice,
  defaultMinPrice,
  filtersStore,
  setPriceRange,
} from "@/lib/states/filters-store";

interface PriceRangeFilterProps {
  onUpdateFilter: (closePopup?: boolean) => void;
}

export const PriceRangeFilter = ({ onUpdateFilter }: PriceRangeFilterProps) => {
  const filtersState = useSnapshot(filtersStore);

  return (
    <div className="flex flex-col items-start w-full gap-2.5">
      <strong className="flex font-bold">Rentang Harga</strong>
      <div className="flex w-full gap-2 px-1">
        <Input
          type="text"
          placeholder="Min"
          value={
            filtersState.minPrice === defaultMinPrice
              ? ""
              : filtersState.minPrice.toLocaleString("id-ID")
          }
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            filtersStore.minPrice = Number(value) || 0;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          onBlur={() => {
            onUpdateFilter();
          }}
          className="w-full bg-white"
        />
        <Input
          type="text"
          placeholder="Max"
          value={
            filtersState.maxPrice === defaultMaxPrice
              ? ""
              : filtersState.maxPrice.toLocaleString("id-ID")
          }
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            setPriceRange(filtersState.minPrice, Number(value) || 1000000);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          onBlur={() => {
            onUpdateFilter();
          }}
          className="w-full bg-white"
        />
      </div>
    </div>
  );
};
export default PriceRangeFilter;
