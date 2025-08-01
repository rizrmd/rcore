import { ItemLayoutEnum } from "@/lib/utils";
import type { FC } from "react";

const Grid: FC<{ check: boolean; src: string; alt: string }> = ({
  check,
  src,
  alt,
}) => {
  return (
    <div className="aspect-[3/4] w-full bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-xl">
      {check ? (
        <img
          src={src}
          alt={alt}
          className="object-cover w-full h-full text-center flex items-center justify-center"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "flex";
            target.style.alignItems = "center";
            target.style.justifyContent = "center";
          }}
        />
      ) : (
        <div className="text-gray-400 text-sm flex items-center justify-center w-full h-full">
          Tidak ada gambar
        </div>
      )}
    </div>
  );
};

const List: FC<{ check: boolean; src: string; alt: string }> = ({
  check,
  src,
  alt,
}) => {
  return (
    <div className="w-40 h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
      {check ? (
        <img
          src={src}
          alt={alt}
          className="object-cover w-full h-full"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "flex";
            target.style.alignItems = "center";
            target.style.justifyContent = "center";
          }}
        />
      ) : (
        <div className="text-gray-400 text-sm flex items-center justify-center w-full h-full">
          Tidak ada gambar
        </div>
      )}
    </div>
  );
};

const Compact: FC<{ check: boolean; src: string; alt: string }> = ({
  check,
  src,
  alt,
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-100 flex-shrink-0 rounded overflow-hidden">
        {check ? (
          <img src={src} alt={alt} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No img
          </div>
        )}
      </div>
      <span className="font-medium text-sm">{alt}</span>
    </div>
  );
};

export const Img: FC<{
  type: ItemLayoutEnum;
  check: boolean;
  src: string;
  alt?: string;
}> = ({ type, check, src, alt }) => {
  return type === ItemLayoutEnum.GRID ? (
    <Grid check={check} src={src} alt={alt || ""} />
  ) : type === ItemLayoutEnum.LIST ? (
    <List check={check} src={src} alt={alt || ""} />
  ) : (
    <Compact check={check} src={src} alt={alt || ""} />
  );
};
