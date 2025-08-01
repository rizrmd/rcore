import { useLocal } from "@/lib/hooks/use-local";
import { ChevronDown, ChevronUp } from "lucide-react";

export const FooterAccordion = ({ title = "" as string, children }) => {
  const local = useLocal(
    {
      open: false as boolean,
    },
    () => {}
  );
  const handleToggle = () => {
    local.open = !local.open;
    local.render();
  };

  return (
    <div className="flex flex-col w-full border-b border-[#8D93CE] lg:border-none">
      <h3
        onClick={handleToggle}
        className="flex justify-between lg:justify-start items-center cursor-poiinter lg:cursor-default"
      >
        <span>{title}</span>
        <span className={`flex lg:hidden`}>
          {local.open ? <ChevronUp /> : <ChevronDown />}
        </span>
      </h3>
      <div
        className={`w-full ${
          local.open ? "block pb-4 lg:pb-0" : "hidden lg:block"
        }`}
      >
        {children}
      </div>
    </div>
  );
};
