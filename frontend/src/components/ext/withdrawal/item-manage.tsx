import { formatCurrency, formatDate, ItemLayoutEnum } from "@/lib/utils";
import type { FC } from "react";

interface WithdrawalData {
  id: string;
  amount: number | string;
  status: string;
  requested_at: string | Date;
  processed_at?: string | Date | null;
  id_publisher: string;
  id_author?: string | null;
  author?: {
    id: string;
    name: string;
    bank_account_number?: string | null;
    bank_account_provider?: string | null;
    bank_account_holder?: string | null;
  } | null;
  publisher?: {
    id: string;
    name: string;
    bank_account_number?: string | null;
    bank_account_provider?: string | null;
    bank_account_holder?: string | null;
  } | null;
}

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

export function withdrawal(withdrawal: WithdrawalData): Record<string, string> {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Menunggu";
      case "processed":
        return "Diproses";
      case "completed":
        return "Selesai";
      case "rejected":
        return "Ditolak";
      default:
        return status;
    }
  };

  const getBankInfo = () => {
    if (
      withdrawal.author?.bank_account_provider &&
      withdrawal.author?.bank_account_number
    ) {
      return `${withdrawal.author.bank_account_provider} - ${withdrawal.author.bank_account_number}`;
    }
    if (
      withdrawal.publisher?.bank_account_provider &&
      withdrawal.publisher?.bank_account_number
    ) {
      return `${withdrawal.publisher.bank_account_provider} - ${withdrawal.publisher.bank_account_number}`;
    }
    return "Belum diatur";
  };

  const getAccountHolder = () => {
    if (withdrawal.author?.bank_account_holder) {
      return withdrawal.author.bank_account_holder;
    }
    if (withdrawal.publisher?.bank_account_holder) {
      return withdrawal.publisher.bank_account_holder;
    }
    return "Belum diatur";
  };

  return {
    Jumlah: formatCurrency(Number(withdrawal.amount)),
    Status: getStatusBadge(withdrawal.status),
    Pemilik:
      withdrawal.author?.name ||
      withdrawal.publisher?.name ||
      "Tidak diketahui",
    Bank: getBankInfo(),
    "Atas Nama": getAccountHolder(),
    "Tanggal Pengajuan": formatDate(String(withdrawal.requested_at)),
    "Tanggal Diproses": withdrawal.processed_at
      ? formatDate(String(withdrawal.processed_at))
      : "Belum diproses",
  };
}
