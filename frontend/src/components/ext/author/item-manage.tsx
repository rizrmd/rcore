import { ItemLayoutEnum } from "@/lib/utils";
import type { Author } from "shared/types";
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

export function author(author: Author): Record<string, string> {
  return {
    Email: author.auth_user?.[0]?.email ?? "-",
    "Jumlah Buku": author.book?.length?.toString() ?? "0",
    "Jumlah Produk": author.product?.length?.toString() ?? "0",
    "Nama Pengguna": author.auth_user?.name || author.name || "Tidak Diketahui",
    "Status Email": author.auth_user?.email_verified
      ? "Terverifikasi"
      : "Belum Terverifikasi",
  };
}
