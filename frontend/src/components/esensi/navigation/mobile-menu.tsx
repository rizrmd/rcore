import { Link, navigate } from "@/lib/router";
import { useRouter } from "@/lib/hooks/use-router";
import { ChevronRight, Pencil, X, Search } from "lucide-react";
import { useLocal } from "@/lib/hooks/use-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MenuItem {
  url?: string;
  label?: string;
  newtab?: boolean;
  submenu?: MenuItem[];
  icon?: string;
}

interface MobileMenuProps {
  data?: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ data = [], isOpen, onClose }: MobileMenuProps) => {
  const router = useRouter();
  
  // Extract search query from URL if on search page
  const getSearchQuery = () => {
    if (router.currentPath.startsWith('/search/')) {
      const query = router.currentPath.split('/search/')[1];
      return decodeURIComponent(query || '');
    }
    return '';
  };
  
  const local = useLocal({
    expandedItems: new Set<string>(),
    searchQuery: getSearchQuery(),
  });

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(local.expandedItems);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    local.expandedItems = newExpanded;
    local.render();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (local.searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(local.searchQuery.trim())}`);
      local.searchQuery = "";
      local.render();
      onClose();
    }
  };

  const renderMenuItem = (item: MenuItem, path: string = "", level: number = 0) => {
    const currentPath = `${path}/${item.label}`;
    const hasSubmenu = item?.submenu && item.submenu.length > 0;
    const isExpanded = local.expandedItems.has(currentPath);
    const isActive = item?.url && router.currentPath.startsWith(item.url);

    return (
      <li key={currentPath} className="border-b border-gray-100 last:border-b-0">
        <div className="flex items-center">
          {hasSubmenu ? (
            <button
              onClick={() => toggleExpanded(currentPath)}
              className={`flex-1 flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 ${
                isActive ? "text-[#3B2C93] font-semibold" : ""
              }`}
              style={{ paddingLeft: `${(level + 1) * 16}px` }}
            >
              <span className="flex items-center gap-2">
                {item.label}
                {item.icon === "Pencil" && <Pencil size={16} />}
              </span>
              <ChevronRight
                size={20}
                className={`transform transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>
          ) : (
            <Link
              href={item.url || "#"}
              target={item.newtab ? "_blank" : "_self"}
              onClick={onClose}
              className={`flex-1 flex items-center gap-2 px-4 py-3 hover:bg-gray-50 ${
                isActive ? "text-[#3B2C93] font-semibold" : ""
              }`}
              style={{ paddingLeft: `${(level + 1) * 16}px` }}
            >
              {item.label}
              {item.icon === "Pencil" && <Pencil size={16} />}
            </Link>
          )}
        </div>
        {hasSubmenu && isExpanded && (
          <ul className="bg-gray-50">
            {item.submenu!.map((subItem) =>
              renderMenuItem(subItem, currentPath, level + 1)
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black opacity-40 z-[9998] transition-opacity lg:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-[9999] transform transition-transform lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X size={20} />
          </Button>
        </div>
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Cari..."
              value={local.searchQuery}
              onChange={(e) => {
                local.searchQuery = e.target.value;
                local.render();
              }}
              className="w-full pr-10"
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2"
            >
              <Search size={20} />
            </Button>
          </form>
        </div>
        <nav className="overflow-y-auto h-[calc(100%-128px)]">
          <ul className="py-2">
            {data.map((item) => renderMenuItem(item))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileMenu;