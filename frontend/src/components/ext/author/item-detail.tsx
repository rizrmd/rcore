import type { Author } from "shared/types";
import type { FC, ReactNode } from "react";

const ItemDetail: FC<{
  label: string;
  value: string | number | ReactNode;
}> = ({ label, value }) => (
  <div className="mb-2 text-sm text-gray-600">
    {label}:&nbsp;
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export const ItemDetails: FC<{
  list: Record<string, string | number | ReactNode>;
}> = ({ list }) =>
  Object.entries(list).map((val, index) => (
    <ItemDetail key={index} label={val[0]} value={val[1]} />
  ));

export const author = (author: Author | null) => {
  const detail = {
    Nama: author?.name,
    Email: author?.auth_user?.[0]?.email ?? "-",
    "Media Sosial": author?.social_media ? (
      <a
        href={author.social_media}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {author.social_media}
      </a>
    ) : (
      "-"
    ),
    "Jumlah Buku": author?.book?.length?.toString() ?? "0",
    "Jumlah Produk": author?.product?.length?.toString() ?? "0",
    // Status: author?.auth_user?.some(x => x.email_verified) ? "Terverifikasi" : "Belum Terverifikasi",
    "Pengguna Terhubung": author?.auth_user ? "❌" : "✅",
    "Nama Pengguna": author?.auth_user?.name ?? "-",
    "Email Pengguna": author?.auth_user?.email ?? "-",
    Biografi: author?.biography ? (
      <div
        className="font-medium text-gray-900 mt-2 p-3 border border-gray-100 rounded-md"
        dangerouslySetInnerHTML={{
          __html: author?.biography,
        }}
      />
    ) : (
      <span className="font-medium text-gray-900">-</span>
    ),
  };

  return detail;
};
