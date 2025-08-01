import { ItemLayoutEnum } from "@/lib/utils";
import type { Publisher } from "shared/types";
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

export function publisher(publisher: Publisher): Record<string, string> {
  return {
    Alamat: publisher.address!,
    Website: publisher.website!,
    Deskripsi: publisher.description!,
    "Total transaksi": publisher._count?.transaction?.toString() || "0",
    "Total withdrawal": publisher._count?.withdrawal?.toString() || "0",
    "Total promo code": publisher._count?.promo_code?.toString() || "0",
  };
}
