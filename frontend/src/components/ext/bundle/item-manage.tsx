import { formatCurrency, ItemLayoutEnum } from "@/lib/utils";
import type { BundleGetResponse } from "shared/types";
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

export function bundle(bundle: BundleGetResponse): Record<string, string> {
  const productCount = bundle.bundle_product?.length || 0;
  return {
    Penulis: bundle.author?.id || "-",
    "Jumlah Produk": productCount + " produk",
    "Harga Coret": bundle.strike_price
      ? formatCurrency(bundle.strike_price, bundle.currency)
      : "-",
    "Harga Jual": formatCurrency(bundle.real_price, bundle.currency),
    Status: bundle.status || "-",
  };
}
