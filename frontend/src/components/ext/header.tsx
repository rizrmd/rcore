import { cn } from "@/lib/utils";
import type { FC } from "react";

export const Header: FC<{ title: string; className?: string }> = ({
  title,
  className,
}) => (
  <div className={cn(!className && "mb-6 flex items-center gap-4")}>
    <h1 className="text-2xl font-bold">{title}</h1>
  </div>
);
