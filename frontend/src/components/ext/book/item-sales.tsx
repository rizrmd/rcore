import { formatCurrency } from "@/lib/utils";
import type { Book } from "shared/types";
import type { FC } from "react";

const Item: FC<{
  label: string;
  value?: string;
}> = ({ label, value }) => (
  <div className="flex flex-col space-y-2">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export const Items: FC<{
  item: Record<string, string>;
}> = ({ item }) =>
  Object.entries(item).map(([label, value]) => (
    <Item key={label} label={label} value={value} />
  ));

export function book(book: Book | null): Record<string, string> {
  return {
    Judul: book?.name ?? "-",
    Penulis: book?.author?.name ?? "-",
    "Harga Coret": formatCurrency(book?.product?.strike_price, book?.currency),
    Harga: formatCurrency(book?.product?.real_price, book?.currency),
    Status: book?.status ?? "-",
  };
}
