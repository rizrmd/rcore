import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
} from "@/components/ui/sidebar";
import { AppLogo } from "../../app/logo";
import {
  Home,
  BookOpenText,
  ShoppingCart,
  Store,
  BellRing,
  User,
  Heart,
  Settings,
  Search,
  Plus,
  Minus,
  Package,
} from "lucide-react";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import type { StoreCategoryItem } from "../store/store-categories";

export function AppSidebar() {
  const local = useLocal({
    searchQuery: "",
    showCategories: false,
    categories: [] as StoreCategoryItem[],
  }, async () => {
    // Initial categories for example
    local.categories = [
      { name: "Novel", slug: "novel" },
      { name: "Pendidikan", slug: "pendidikan" },
      { name: "Anak-anak", slug: "anak-anak" },
      { name: "Agama", slug: "agama" },
      { name: "Bisnis", slug: "bisnis" }
    ];
  });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && local.searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(local.searchQuery)}`);
    }
  };

  const toggleCategories = () => {
    local.showCategories = !local.showCategories;
    local.render();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="hidden lg:block">
          <AppLogo />
        </div>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <SidebarInput 
              placeholder="Cari buku..."
              className="pl-8"
              value={local.searchQuery}
              onChange={(e) => {
                local.searchQuery = e.target.value;
                local.render();
              }}
              onKeyUp={handleSearch}
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/">
                  <Home />
                  <span>Beranda</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/store">
                  <Store />
                  <span>Toko Buku</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/cart">
                  <ShoppingCart />
                  <span>Keranjang</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/library">
                  <BookOpenText />
                  <span>Perpustakaan</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel 
            className="flex justify-between items-center cursor-pointer"
            onClick={toggleCategories}
          >
            <span>Kategori</span>
            {local.showCategories ? (
              <Minus className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </SidebarGroupLabel>
          {local.showCategories && (
            <SidebarMenu>
              {local.categories.map((category, idx) => (
                <SidebarMenuItem key={`category_${idx}`}>
                  <SidebarMenuButton asChild>
                    <a href={`/category/${category.slug}`}>
                      <span>{category.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Akun</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/profile">
                  <User />
                  <span>Profil</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/wishlist">
                  <Heart />
                  <span>Wishlist</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/shipment">
                  <Package />
                  <span>Pengiriman</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/notifications">
                  <BellRing />
                  <span>Notifikasi</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/settings">
                  <Settings />
                  <span>Pengaturan</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
