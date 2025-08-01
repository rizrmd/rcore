import { BadgeStatus } from "shared/types";
import type { FC } from "react";
import { Badge } from "../ui/badge";

export const MyBadge: FC<{ status: BadgeStatus }> = ({ status }) => {
  switch (status) {
    case BadgeStatus.PAID:
      return <Badge className="bg-green-500">Lunas</Badge>;
    case BadgeStatus.PENDING:
      return <Badge className="bg-yellow-500">Menunggu Pembayaran</Badge>;
    case BadgeStatus.CART:
      return <Badge className="bg-blue-500">Keranjang</Badge>;
    case BadgeStatus.CANCELED:
      return <Badge className="bg-red-500">Dibatalkan</Badge>;
    case BadgeStatus.EXPIRED:
      return <Badge className="bg-gray-500">Kadaluarsa</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
