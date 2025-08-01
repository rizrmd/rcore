import { AppLogo } from "@/components/app/logo";
import { NotifDropdown } from "@/components/ext/notification-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  betterAuth,
  type AuthClientGetSessionAPIResponse,
} from "@/lib/better-auth";
import { api } from "@/lib/gen/publish.esensi";
import { useRouter } from "@/lib/hooks/use-router";
import { navigate } from "@/lib/router";
import { ChevronDown, Loader2, Menu } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import type { User } from "shared/types";

type MenuItem = {
  label: string;
  href?: string;
  action?: string;
};

const mainMenu: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Penulis", href: "/authors" },
  { label: "Buku", href: "/books" },
  { label: "Bundle", href: "/bundles" },
  { label: "Penarikan", href: "/withdrawals" },
];

const userMenu: MenuItem[] = [
  { label: "Profil", href: "/author.profil" },
  { label: "Alamat", href: "/author-address" },
  { label: "Pengiriman", href: "/shipments" },
  { label: "Keluar", action: "signout" },
];

// Module-level state that persists between renders
const local = {
  mainMenu: [...mainMenu] as typeof mainMenu,
  userMenu: [...userMenu] as typeof userMenu,
  user: null as User | null,
  showNotif: false,
  isDrawerOpen: false,
  initialized: false,
  loading: true,
  hasNonChapterBooks: false,
};

export const MenuBarPublish: FC<{ title?: string }> = ({ title } = {}) => {
  const { currentPath } = useRouter();
  const [, forceUpdate] = useState({});

  const render = () => {
    forceUpdate({});
  };

  useEffect(() => {
    if (local.initialized) return;

    const checkNonChapterBooks = async (user: User) => {
      try {
        if (user.idAuthor) {
          const response = await api.books({
            action: "list",
            where: {
              id_author: user.idAuthor,
              is_chapter: false,
              deleted_at: null,
            },
            limit: 1, // Just need to know if any exist
          });

          local.hasNonChapterBooks =
            response.success && response.data.total > 0;
        }
      } catch (error) {
        console.error("Failed to check non-chapter books:", error);
        local.hasNonChapterBooks = false;
      }
    };

    const initializeAuth = async () => {
      try {
        const session: AuthClientGetSessionAPIResponse =
          await betterAuth.getSession();
        if (session) {
          const user = session.data?.user;
          local.user = user || null;
          if (user) {
            // Check for non-chapter books first
            await checkNonChapterBooks(user);

            // Filter main menu based on user role and book status
            local.mainMenu = [...mainMenu];

            if (user.idAuthor && !user.idPublisher) {
              local.mainMenu = local.mainMenu.filter(
                (x) => x.label !== "Penulis"
              );
            }

            // Hide Bundles and Penarikan if user has no non-chapter books
            if (!local.hasNonChapterBooks) {
              local.mainMenu = local.mainMenu.filter(
                (x) => x.label !== "Bundle" && x.label !== "Penarikan"
              );
            }

            // Filter userMenu based on hasNonChapterBooks
            local.userMenu = [...userMenu].filter((item) => {
              // Only show Pengiriman and Alamat if user has physical books
              if (item.label === "Pengiriman" || item.label === "Alamat") {
                return local.hasNonChapterBooks;
              }
              return true;
            });

            if (!user.idAuthor && user.idPublisher) {
              local.userMenu = local.userMenu.map((x) => {
                if (x.label === "Profil") x.href = "/publisher.profil";
                return x;
              });
            }
            local.showNotif = true;
          } else {
            local.mainMenu = [];
            local.userMenu = userMenu.filter((x) => x.action === "signout");
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        local.mainMenu = [];
        local.userMenu = userMenu.filter((x) => x.action === "signout");
      } finally {
        local.loading = false;
        local.initialized = true;
        render();
      }
    };

    initializeAuth();
  }, []);

  const handleMenuClick = (item: MenuItem) => {
    if (item.action === "signout")
      betterAuth.signOut().finally(() => (window.location.href = "/"));
    else if (item.href) navigate(item.href);

    // Close drawer after navigation
    local.isDrawerOpen = false;
    render();
  };

  const getUserInitials = (user: User | null) => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          {/* Mobile Drawer */}
          <div className="-mx-2 h-full lg:hidden">
            <Sheet
              open={local.isDrawerOpen}
              onOpenChange={(open) => {
                local.isDrawerOpen = open;
                render();
              }}
            >
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-full w-auto aspect-1/1" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 mt-6">
                  {local.loading ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Main Menu Items */}
                      {local.mainMenu
                        .filter(
                          (item) =>
                            currentPath !== "/onboarding" ||
                            (currentPath === "/onboarding" &&
                              item.action === "signout")
                        )
                        .map((item) => (
                          <Button
                            key={item.href || item.action}
                            variant={
                              currentPath === item.href ? "default" : "ghost"
                            }
                            className="font-medium justify-start rounded-sm"
                            onClick={() => handleMenuClick(item)}
                          >
                            {item.label}
                          </Button>
                        ))}

                      {/* User Menu Items */}
                      {local.user && local.userMenu.length > 0 && (
                        <>
                          <div className="border-t my-2" />
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                            {local.user.name || "User Account"}
                          </div>
                          {local.userMenu.map((item) => (
                            <Button
                              key={item.href || item.action}
                              variant={
                                currentPath === item.href ? "default" : "ghost"
                              }
                              className="font-medium justify-start rounded-sm"
                              onClick={() => handleMenuClick(item)}
                            >
                              {item.label}
                            </Button>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <AppLogo className="h-8 w-auto" />
          <span className="font-bold text-lg text-gray-700 text-center">
            {title}
          </span>

          {/* Role Badge */}
          {local.user && (local.user.idAuthor || local.user.idPublisher) && (
            <div className="flex items-center -ml-6">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-sm border ${
                  local.user.idAuthor && local.user.idPublisher
                    ? "bg-purple-100 text-purple-800 border-purple-300"
                    : local.user.idAuthor
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : "bg-green-100 text-green-800 border-green-300"
                }`}
              >
                {local.user.idAuthor && local.user.idPublisher
                  ? "Penulis & Publisher"
                  : local.user.idAuthor
                  ? "Penulis"
                  : "Publisher"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {local.loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <>
              {local.showNotif && local.user && (
                <NotifDropdown user={local.user} />
              )}

              {/* Desktop Menu */}
              <div className="hidden lg:flex items-center gap-2">
                {/* Main Menu Items */}
                {local.mainMenu
                  .filter(
                    (item) =>
                      currentPath !== "/onboarding" ||
                      (currentPath === "/onboarding" &&
                        item.action === "signout")
                  )
                  .map((item) => (
                    <Button
                      key={item.href || item.action}
                      variant={currentPath === item.href ? "default" : "ghost"}
                      className="font-medium rounded-sm py-1 h-auto"
                      onClick={() => handleMenuClick(item)}
                    >
                      {item.label}
                    </Button>
                  ))}

                {/* User Dropdown */}
                {local.user && local.userMenu.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 rounded-sm py-1 h-auto"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={(local.user as any)?.avatar || ""}
                          />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(local.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {local.user.name || "User"}
                        </span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {local.userMenu.map((item, index) => (
                        <div key={item.href || item.action}>
                          {item.action === "signout" && index > 0 && (
                            <DropdownMenuSeparator />
                          )}
                          <DropdownMenuItem
                            onClick={() => handleMenuClick(item)}
                            className="cursor-pointer"
                          >
                            {item.label}
                          </DropdownMenuItem>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
