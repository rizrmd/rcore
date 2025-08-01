import type { FC } from "react";
import { GlobalLoading } from "../esensi/ui/global-loading";

export const AppLoading: FC<{ logo?: boolean }> = ({ logo }) => {
  return (
    <div className="flex-1 flex items-center justify-center flex-col w-full h-full space-y-[8px] opacity-70 py-[40px]">
      <GlobalLoading />
    </div>
  );
};
