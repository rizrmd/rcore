import type { FC } from "react";

export const Img: FC<{ check: boolean; src: string; alt?: string }> = ({
  check,
  src,
  alt,
}) => (
  <div className="w-full bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-xl">
    {check ? (
      <img src={src} alt={alt} className="mx-auto object-cover" />
    ) : (
      <div className="text-gray-400 text-sm">Tidak ada gambar</div>
    )}
  </div>
);
