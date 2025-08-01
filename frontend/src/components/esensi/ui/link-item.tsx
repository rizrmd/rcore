import { Link } from "@/lib/router";
import { ChevronRight } from "lucide-react";

export const LinkItem = ({
  label,
  sublabel = null as string | null,
  url,
  newTab = false as boolean,
  icon = null as any | null,
}) => {
  return (
    <Link
      href={url}
      target={newTab ? "_blank" : "_self"}
      className="flex justify-start w-full items-center text-[#3B2C93] gap-3 py-3 border-b border-b-[#E1E5EF] [&:last-child]:border-b-0"
    >
      {icon !== null && icon}{" "}
      <div className="flex justify-between items-center grow-1 gap-3 text-left">
        <span className="whitespace-nowrap shrink-0">{label}</span>
        {sublabel !==null && sublabel !== "" && (<span className="shrink-1 text-[9px] whitespace-pre-line h-auto leading-[1.2]">{sublabel}</span>)}
      </div>
      <ChevronRight />
    </Link>
  );
};

export default LinkItem;
