import type { FC } from "react";

export const Item: FC<{
  label: string;
  value?: string;
}> = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);
