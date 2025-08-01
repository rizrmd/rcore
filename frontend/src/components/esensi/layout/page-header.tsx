import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { Link, navigate } from "@/lib/router";
import { cartState } from "@/lib/states/cart-state";
import { ArrowLeft, Search, ShoppingCart, User } from "lucide-react";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesktopMenu } from "../navigation/desktop-menu";
import { ImgThumb } from "../ui/img-thumb";
import { preload } from "@/lib/hooks/use-router";

const cached = {
  contents: {
    logo: {
      img: `/img/esensi-online-logo.png` as string,
      alt: `Esensi Online` as string,
    },
    searchbar: {
      placeholder: `` as string,
    },
    menuItems: [] as any,
  },
};

export const PageHeader = ({
  enable = true as boolean,
  logo = true as boolean,
  back = true as boolean,
  title = "Esensi Online" as string | null,
  search = true as boolean,
  searchQuery = "" as string,
  cart = true as boolean,
  profile = true as boolean,
  mobileHide = false as boolean,
  desktopHide = false as boolean,
  toggleProfile,
  user = null as any,
}) => {
  const cartRead = useSnapshot(cartState.write);

  const local = useLocal(
    {
      enable: enable,
      logo: logo,
      back: back,
      title: title,
      search: search,
      searchQuery: searchQuery,
      cart: cart,
      profile: profile,
      mobileHide: mobileHide,
      desktopHide: desktopHide,
    },
    async () => {
      preload([
        "/",
        "/ebook",
        "/ebook/_",
        "/book",
        "/book/_",
        "/product/_",
        "/bundles",
        "/bundles/_",
        "/bundle/_",
        "/category/_",
        "/category/_/_",
        "/genre/_",
        "/genre/_/_",
        
      ]);
      if (cached.contents.menuItems.length === 0) {
        const res = await api.header();
        if (res?.data) {
          cached.contents.searchbar = res.data?.searchbar;
          cached.contents.menuItems = res.data?.menu;
        }

        if (mobileHide && desktopHide) {
          local.enable = false;
        }

        // Load cart state on initialization
        cartState.load();
        local.render();
      }
    }
  );

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(`/search/${encodeURIComponent(local.searchQuery)}`);
    }
  };

  const visibility =
    local.enable && mobileHide
      ? "hidden lg:flex"
      : local.enable && desktopHide
      ? "flex lg:hidden"
      : local.enable
      ? "flex"
      : "hidden lg:flex";

  return (
    <header
      className={`sticky top-0 z-50 lg:static ${visibility} flex-row justify-center items-center w-full bg-background h-12 ${
        local.back ? "" : "pl-4 lg:p-none"
      } lg:h-36`}
    >
      <div className="flex w-full justify-center items-center max-w-[1200px] h-full">
        {/* Back Button */}
        {local.back && (
          <div
            className={`flex h-full justify-start items-center ${
              local.logo || local.search ? "w-auto" : "w-full grow-1"
            } lg:hidden`}
          >
            <button
              className="flex h-full aspect-1/1 justify-center items-center [&>svg]:stroke-[#3B2C93] cursor-pointer"
              onClick={() => history.back()}
            >
              <ArrowLeft size={25} strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* Logo */}
        <Link
          href="/"
          className={`w-auto h-auto ${
            local.logo ? "flex" : "hidden lg:flex"
          } shrink-0`}
        >
          <ImgThumb
            src={cached.contents?.logo?.img}
            alt={cached.contents?.logo?.alt}
            className="h-8 w-auto lg:h-16"
            skipResize={true}
          />
        </Link>

        {/* Title Bar */}
        {local.title !== null && local.title !== "" && (
          <div className="flex lg:hidden justify-content items-center color-[#3B2C93] whitespace-nowrap">
            <span className="flex w-full justify-center items-center text-[#3B2C93] font-bold">
              {local.title}
            </span>
          </div>
        )}

        {/* Role Badge */}
        {/* {user && (user.idAuthor || user.idPublisher) && (
          <div className="flex items-center ml-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
              user.idAuthor && user.idPublisher 
                ? 'bg-purple-100 text-purple-800 border-purple-300' 
                : user.idAuthor 
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-green-100 text-green-800 border-green-300'
            }`}>
              {user.idAuthor && user.idPublisher ? 'Author & Publisher' : user.idAuthor ? 'Author' : 'Publisher'}
            </span>
          </div>
        )} */}

        {/* Search Bar */}

        <div
          className={`${
            local.search ? "flex" : "hidden lg:flex"
          } w-full grow-1 mx-4 lg:ml-12 lg:mr-4 `}
        >
          <div className="flex w-full relative">
            <Search className="absolute left-2 lg:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={cached.contents?.searchbar?.placeholder}
              className="w-full pl-8 lg:pl-10 bg-[#F6F6F6] text-[#000] rounded-full text-sm border-none focus:border-none focus:ring-0"
              value={local.searchQuery}
              onChange={(e) => {
                local.searchQuery = e.target.value;
                local.render();
              }}
              onKeyUp={handleSearch}
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <DesktopMenu data={cached.contents.menuItems} />

        {/* Right side icons */}
        <div
          className={`flex justify-end items-center ${
            local.search ? "w-auto" : "w-full"
          } grow-1 lg:grow-0 lg:w-auto`}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/cart")}
            className={`${
              local.cart ? "flex" : "hidden lg:flex"
            } rounded-full p-2 aspect-square relative`}
          >
            <ShoppingCart
              color="#3B2C93"
              strokeWidth={2.25}
              className="size-5"
            />
            {cartState.getItemCount() > 0 && (
              <span className="flex min-w-4 h-auto justify-center items-center absolute aspect-1/1 p-1 top-0 right-0 bg-[#d0011b] text-white text-[9px] font-semibold rounded-full text-center leading-1">
                {cartState.getItemCount()}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              toggleProfile();
            }}
            className={`${
              local.profile ? "flex" : "hidden lg:flex"
            } rounded-full p-2 aspect-square`}
          >
            <User color="#3B2C93" strokeWidth={2.25} className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
export default PageHeader;
