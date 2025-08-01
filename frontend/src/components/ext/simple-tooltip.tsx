import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FC, ReactNode } from "react";

export const SimpleTooltip: FC<{
  content: ReactNode;
  children: ReactNode;
  delay?: number;
}> = ({ content, children, delay }) => (
  <TooltipProvider>
    <Tooltip delayDuration={delay || 1000}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent sideOffset={0} alignOffset={0}>
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
