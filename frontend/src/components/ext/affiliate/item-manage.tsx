import { ItemLayoutEnum } from "@/lib/utils";
import type { Affiliate } from "shared/types";
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

export function affiliate(affiliate: Affiliate): Record<string, string> {
  return {
    ID: affiliate.id?.substring(0, 8) + "...",
    "Pengguna Terhubung": !affiliate.auth_user ? "❌" : "✅",
    "Nama Pengguna": affiliate.auth_user?.name || affiliate.name || "-",
    "Email Pengguna": affiliate.auth_user?.email || "-",
    "Status Email": affiliate.auth_user?.email_verified
      ? "Terverifikasi"
      : "Belum Terverifikasi",
  };
}
