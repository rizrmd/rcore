import type { FC } from "react";

export const Img: FC<{ check: boolean; src: string; alt: string }> = ({
  check,
  src,
  alt,
}) => (
  <div className="w-full md:w-1/4">
    <div className="aspect-[3/4] w-full bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
      {check ? (
        <img src={src} alt={alt} className="object-cover w-full h-full" />
      ) : (
        <div className="text-gray-400 text-sm flex items-center justify-center w-full h-full">
          Tidak ada gambar
        </div>
      )}
    </div>
  </div>
);
