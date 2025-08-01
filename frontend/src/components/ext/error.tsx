import type { FC, ReactNode } from "react";
import { AppLoading } from "../app/loading";

export const Error: FC<{
  msg: string;
  loading?: boolean;
  children?: ReactNode;
}> = ({ msg, loading, children }) =>
  loading ? (
    <AppLoading />
  ) : msg ? (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-8 shadow-sm">
      {msg}
    </div>
  ) : (
    children
  );
