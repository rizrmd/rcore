import type { FC } from "react";

export const AppLoading: FC<{ logo?: boolean }> = ({ logo }) => {
  return (
    <div className="flex-1 flex items-center justify-center flex-col w-full h-full space-y-[8px] opacity-70 py-[40px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};