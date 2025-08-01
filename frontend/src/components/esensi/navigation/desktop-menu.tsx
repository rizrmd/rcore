import { Link } from "@/lib/router";
import { useRouter } from "@/lib/hooks/use-router";
import { ChevronDown, Pencil } from "lucide-react";

interface MenuItem {
  url?: string;
  label?: string;
  newtab?: boolean;
  submenu?: MenuItem[];
  icon?: string;
}

interface DesktopMenuProps {
  data?: MenuItem[];
  parent?: any;
  cssHover?: string;
  cssHoverSub?: string;
  cssActive?: string;
  cssActiveSub?: string;
}

export const DesktopMenu = ({ data = [], parent = null, cssHover = "", cssHoverSub = "", cssActive = "", cssActiveSub = "" }: DesktopMenuProps) => {
  
  cssHover = cssHover !== `` ? cssHover : 'hover:[&>a]:text-[#3B2C93]';
  cssHoverSub = cssHoverSub !== `` ? cssHoverSub : 'hover:[&>a]:bg-[#e1e5ef] hover:[&>a]:text-[#3B2C93]';
  cssActive = cssActive !== `` ? cssActive : 'text-[#3B2C93] underline underline-offset-10 decoration-2';
  cssActiveSub = cssActiveSub !== `` ? cssActiveSub : 'text-[#3B2C93] font-semibold bg-[#e1e5ef]';
  
  
  const router = useRouter();
  
  // Helper function to check if any submenu item is active
  const hasActiveSubmenu = (submenu: MenuItem[]): boolean => {
    if (!submenu || submenu.length === 0) return false;
    
    return submenu.some(subItem => {
      // Check if this submenu item itself is active
      if (subItem?.url && router.currentPath.startsWith(subItem.url)) {
        return true;
      }
      // Recursively check nested submenus
      if (subItem?.submenu && subItem.submenu.length > 0) {
        return hasActiveSubmenu(subItem.submenu);
      }
      return false;
    });
  };

  const build = (menu: MenuItem[] = [], parent: any = null) => {
    // For genre submenu with many items, split into columns
    if (parent !== null && menu.length > 5) {
      const maxColumns = 3;
      const totalItems = menu.length;
      const columnsNeeded = Math.min(Math.ceil(totalItems / 5), maxColumns);
      const itemsPerColumn = Math.ceil(totalItems / columnsNeeded);
      
      const columns: MenuItem[][] = [];
      for (let i = 0; i < columnsNeeded; i++) {
        const start = i * itemsPerColumn;
        const end = Math.min(start + itemsPerColumn, totalItems);
        columns.push(menu.slice(start, end));
      }
      
      const columnElements = columns.map((columnItems, colIdx) => {
        const columnList = columnItems.map((item, idx) => {
          const isActive = item?.url && router.currentPath.startsWith(item.url);
          
          return (
            <li
              className={`flex relative h-7 w-auto ${cssHoverSub}`}
              key={`esensi_dmenu_${parent}_col${colIdx}_${idx}`}
            >
              <Link
                href={item?.url || "#"}
                target={item?.newtab ? "_blank" : "_self"}
                className={`flex h-full gap-1.5 whitespace-pre items-center px-4 w-full min-w-[140px] ${isActive ? cssActiveSub : ""}`}
              >
                {item?.label}
                {item?.icon === "Pencil" && <Pencil size={16} className="ml-1" />}
              </Link>
            </li>
          );
        });
        
        return (
          <div key={`column_${colIdx}`} className="flex flex-col">
            {columnList}
          </div>
        );
      });
      
      const the_wrapper = (
        <ul
          className={`flex absolute min-w-[160px] w-auto text-[13px] left-0 py-2 bg-white -ml-4 shadow-md outline outline-[#e1e5ef] rounded-sm z-[9999]`}
        >
          {columnElements}
        </ul>
      );
      return the_wrapper;
    }
    
    // Original logic for regular menus
    const the_list = menu.map((item, idx) => {
      const the_submenu =
        item?.submenu && item?.submenu !== null && item?.submenu.length > 0 ? (
          build(item.submenu, idx)
        ) : (
          <></>
        );
      const the_chevron =
        item?.submenu && item?.submenu !== null && item?.submenu.length > 0 ? (
          <ChevronDown size={14} />
        ) : (
          <></>
        );
      
      // Check if current path matches this menu item OR if any submenu item is active
      const isDirectlyActive = item?.url && router.currentPath.startsWith(item.url);
      const hasActiveChild = item?.submenu && hasActiveSubmenu(item.submenu);
      const isActive = isDirectlyActive || hasActiveChild;

      return (
        <li
          className={`flex relative ${
            parent !== null ? `h-7 w-auto ${cssHoverSub}` : `h-full ${cssHover}`
          }`}
          key={`esensi_dmenu_${parent !== null ? `${parent}_` : ""}_${idx}`}
        >
          <Link
            href={item?.url || "#"}
            target={item?.newtab ? "_blank" : "_self"}
            className={`flex h-full gap-1.5 whitespace-pre items-center ${
              parent !== null
                ? "px-4 w-full justify-between [&>svg:last-child]:rotate-[-90deg] [&>svg:last-child]:-mr-3"
                : "font-medium"
            } ${isActive ? parent !== null ? cssActiveSub : cssActive : ""}`}
          >
            {item?.label}
            {item?.icon === "Pencil" && <Pencil size={16} className="ml-1" />}
            {the_chevron}
          </Link>
          {the_submenu}
        </li>
      );
    });

    const the_wrapper = (
      <ul
        className={`${
          parent == null
            ? "flex h-10 gap-6 [&_li_ul]:hidden [&_li:hover>ul]:flex"
            : "flex-col absolute min-w-[160px] w-auto text-[13px] left-0 py-2 bg-white -ml-4 shadow-md outline outline-[#e1e5ef] rounded-sm [&_ul]:left-full [&_ul]:ml-0 [&_ul]:-mt-2 z-[9999]"
        } shrink-0 `}
      >
        {the_list}
      </ul>
    );
    return the_wrapper;
  };
  const list = build(data);

  const renderMenu = data.length > 0 && <>{list}</>;
  return (
    <div className="hidden px-3 lg:flex shrink-0 [&_ul_ul]:top-full [&_ul_ul_ul]:top-0">
      {renderMenu}
    </div>
  );
};
export default DesktopMenu;
