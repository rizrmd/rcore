import { ItemLayoutEnum } from "@/lib/utils";
import type { Internal } from "shared/types";
import type { FC } from "react";

const Grid: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="mb-1 text-sm text-gray-600">
    {label}:&nbsp;<span className="font-medium text-gray-900">{value}</span>
  </div>
);

const List: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="text-sm text-gray-600">
    {label}:&nbsp;<span className="font-medium text-gray-900">{value}</span>
  </div>
);

const Compact: FC<{ value: string }> = ({ value }) => (
  <td className="p-2 text-sm">{value}</td>
);

export const Item: FC<{
  type: ItemLayoutEnum;
  item: Record<string, string>;
}> = ({ type, item }) =>
  Object.entries(item).map(([label, value]) =>
    type === ItemLayoutEnum.GRID ? (
      <Grid key={label} label={label} value={value} />
    ) : type === ItemLayoutEnum.LIST ? (
      <List key={label} label={label} value={value} />
    ) : (
      <Compact key={label} value={value} />
    )
  );

export function internal(internal: Internal): Record<string, string> {
  return {
    Nama: internal.name!,
    "Sales & Marketing": internal.is_sales_and_marketing ? "✅" : "❌",
    Support: internal.is_support ? "✅" : "❌",
    Management: internal.is_management ? "✅" : "❌",
    IT: internal.is_it ? "✅" : "❌",
  };
}
