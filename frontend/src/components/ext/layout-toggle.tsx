import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ItemLayoutEnum } from "@/lib/utils";
import { Grid, LayoutGrid, List } from "lucide-react";
import type { FC } from "react";

export type LayoutToggleProps = {
  layout: ItemLayoutEnum;
  onLayoutChange: (value: ItemLayoutEnum) => void;
};

export const LayoutToggle: FC<LayoutToggleProps> = ({
  layout,
  onLayoutChange,
}) => (
  <ToggleGroup
    type="single"
    value={layout}
    onValueChange={(value) => {
      if (value) onLayoutChange(value as ItemLayoutEnum);
    }}
    className="p-0"
  >
    <ToggleGroupItem
      value="grid"
      aria-label="Tampilan Ikon"
      className="cursor-pointer rounded-r-none"
    >
      <Grid className="h-4 w-4" />
    </ToggleGroupItem>
    <ToggleGroupItem
      value="list"
      aria-label="Tampilan Daftar"
      className="cursor-pointer rounded-none border-x-0"
    >
      <LayoutGrid className="h-4 w-4" />
    </ToggleGroupItem>
    <ToggleGroupItem
      value="compact"
      aria-label="Tampilan Daftar Ringkas"
      className="cursor-pointer rounded-l-none"
    >
      <List className="h-4 w-4" />
    </ToggleGroupItem>
  </ToggleGroup>
);
