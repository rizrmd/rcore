import type { FC, ReactNode } from "react";
import { AppLoading } from "../app/loading";

export const Success: FC<{
  msg: string;
  loading?: boolean;
  children?: ReactNode;
}> = ({ msg, loading, children }) =>
  loading ? (
    <AppLoading />
  ) : msg ? (
    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-8 shadow-sm">
      {msg}
    </div>
  ) : (
    children
  );
