import { cn } from "@/lib/utils";
import type { FC } from "react";
import { BookStatus } from "shared/types";

export const Status: FC<{
  noLabel?: boolean;
  status: BookStatus;
  onClick?: () => void;
  props?: React.ComponentProps<"div"> | React.ComponentProps<"span">;
}> = ({ noLabel, status, onClick, props }) => {
  if (noLabel) {
    return (
      <>
        <span
          className={cn(
            "text-sm font-medium px-2 py-1 rounded-full cursor-pointer",
            status === BookStatus.PUBLISHED
              ? "bg-green-100 text-green-800"
              : status === BookStatus.REJECTED
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          )}
          onClick={onClick}
        >
          {status === BookStatus.PUBLISHED
            ? "Diterbitkan"
            : status === BookStatus.REJECTED
            ? "Ditolak"
            : status === BookStatus.SUBMITTED
            ? "Diajukan"
            : "Butuh Revisi Penulis ❗"}
        </span>
      </>
    );
  }

  return (
    <>
      <div
        className="flex items-center gap-2"
        {...(props as React.ComponentProps<"div">)}
      >
        <span className="text-sm text-gray-500">Status Buku:</span>
        <span
          className={cn(
            "text-sm font-medium px-2 py-1 rounded-full",
            status === BookStatus.PUBLISHED
              ? "bg-green-100 text-green-800"
              : status === BookStatus.REJECTED
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          )}
          onClick={onClick}
        >
          {status === BookStatus.PUBLISHED
            ? "Diterbitkan"
            : status === BookStatus.REJECTED
            ? "Ditolak"
            : status === BookStatus.SUBMITTED
            ? "Diajukan"
            : "Butuh Revisi Penulis ❗"}
        </span>
      </div>
    </>
  );
};
