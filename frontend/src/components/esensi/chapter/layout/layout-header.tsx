import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi";
import { EsensiChapterLogo } from "../svg/esensi-chapter-logo";
import DesktopMenu from "../../navigation/desktop-menu";
import MobileMenu from "../../navigation/mobile-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon, TextSearch, User } from "lucide-react";
import { navigate } from "@/lib/router";
import { useRouter } from "@/lib/hooks/use-router";


export const LayoutHeader = ({user = null as any, toggleProfile = ()=>{}}) => {
  const router = useRouter();
  
  // Extract search query from URL if on search page
  const getSearchQuery = () => {
    if (router.currentPath.startsWith('/search/')) {
      const query = router.currentPath.split('/search/')[1];
      return decodeURIComponent(query || '');
    }
    return '';
  };
  
  const local = useLocal(
    {
      menu: [] as any,
      showSearch: false,
      searchQuery: getSearchQuery(),
      showMobileMenu: false,
    },
    async () => {
      const res = await api.header();
      if (res) {
        local.menu = res.data?.menu || [];
        local.render();
      }
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (local.searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(local.searchQuery.trim())}`);
      local.showSearch = false;
      local.searchQuery = "";
      local.render();
    }
  };

  return (
    <>
      <header className="flex justify-center items-center">
        <div className="esensi-container">
          <div className="flex items-center justify-between h-25 gap-4 lg:gap-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                local.showMobileMenu = !local.showMobileMenu;
                local.render();
              }}
              className="h-15 w-15 aspect-square lg:hidden -ml-(--esensi-container-px)"
            >
              <TextSearch className="size-8" />
            </Button>
            <div className="flex-1 flex justify-center lg:justify-start lg:flex-none">
              <div className="shrink-0"><EsensiChapterLogo className="relative h-12 w-auto" link={true}/></div>
            </div>
            <div className="flex justify-start grow-1">
              <DesktopMenu data={local.menu} cssActive="text-(--esensi-color)" cssHover="hover:[&>a]:text-(--esensi-color)" />
            </div>
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative hidden lg:flex items-center">
              <form onSubmit={handleSearch} className={`absolute right-0 flex items-center transition-all duration-300 ease-in-out ${
                local.showSearch ? 'w-40 sm:w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
              }`}>
                <Input
                  type="text"
                  placeholder="Cari..."
                  value={local.searchQuery}
                  onChange={(e) => {
                    local.searchQuery = e.target.value;
                    local.render();
                  }}
                  className="pr-10"
                  autoFocus={local.showSearch}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    local.showSearch = false;
                    local.searchQuery = "";
                    local.render();
                  }}
                  className="absolute right-1 p-1"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </form>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  local.showSearch = !local.showSearch;
                  if (!local.showSearch) {
                    local.searchQuery = "";
                  }
                  local.render();
                }}
                className={`h-15 w-15 lg:h-10 lg:w-10 aspect-square transition-opacity duration-300 ${local.showSearch ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              >
                <SearchIcon className="size-8 lg:size-5" />
              </Button>
            </div>
            <Button 
              variant={user !== null ? "link" : "ghost"} 
              size={user !== null ? "icon" : undefined}
              onClick={(e)=>{
                e.preventDefault();
                toggleProfile();
              }}
              className={user === null ? "h-15 w-15 lg:h-10 lg:w-auto aspect-square lg:aspect-auto" : ""}
            >{user !== null ? (
              <><img src={user.avatar} alt={user.fullname} className="w-10 h-10 rounded-full overflow-hidden object-cover object-center" /></>
            ) : (
              <>
                <User className="size-8 lg:hidden" />
                <span className="hidden lg:inline">Login</span>
              </>
            )}</Button>
          </div>
          </div>
        </div>
      </header>
      <MobileMenu 
        data={local.menu} 
        isOpen={local.showMobileMenu} 
        onClose={() => {
          local.showMobileMenu = false;
          local.render();
        }} 
      />
    </>
  );
};
