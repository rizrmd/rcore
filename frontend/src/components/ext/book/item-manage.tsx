import { formatCurrency, ItemLayoutEnum } from "@/lib/utils";
import type { Book, Product } from "shared/types";
import type { FC } from "react";
import type { chapter } from "shared/models";

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

export function chapter(chapter: chapter): Record<string, string> {
  return {
    Nomor: chapter.number + "",
    Nama: chapter.name ?? "-",
  };
}

export function book(book: Book): Record<string, string> {
  return {
    Penulis: book.author?.name ?? "-",
    Harga: formatCurrency(book.submitted_price, book.currency),
    Status: book.status || "-",
    Chapter: book.is_chapter ? "✅" : "❎",
  };
}

export function product(product: Product): Record<string, string> {
  return {
    Penulis: product.author?.name ?? "-",
    "Harga Coret": formatCurrency(product.strike_price, product.currency),
    "Harga Pajangan": formatCurrency(product.real_price, product.currency),
    Status: product.status || "-",
    Chapter: product.is_chapter ? "✅" : "❎",
  };
}
