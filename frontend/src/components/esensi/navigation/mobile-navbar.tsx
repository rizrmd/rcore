import { useLocal } from "@/lib/hooks/use-local";
import { CircleUser, House, Info, LibraryBig } from "lucide-react";
import { MobileNavbarItem } from "./mobile-navbar-item";
import { navigate } from "@/lib/router";

export const MobileNavbar = ({ enable = true as boolean }) => {

  const list = [
    {
      label: "Home",
      icon: <House size={32} strokeWidth={1.5} />,
      url: "/",
      conditional: null,
    },
    {
      label: "My Library",
      icon: <LibraryBig size={32} strokeWidth={1.5} />,
      url: "/library",
      conditional: null,
    },
    {
      label: "About",
      icon: <Info size={32} strokeWidth={1.5} />,
      url: "/about",
      conditional: null,
    },
    {
      label: "Profile",
      icon: <CircleUser size={32} strokeWidth={1.5} />,
      url: "/profile",
      conditional: null,
    },
  ];

  const local = useLocal(
    {
      enable: true as boolean,
      menuActive: 0 as number,
    },
    async () => {
      local.enable = enable;
      const url = window.location.pathname;
      const activeIndex = list.findIndex((item) => item.url === url);
      local.menuActive = activeIndex !== -1 ? activeIndex : 0;
      // Ensure the local state is updated
      local.render();
    },
  );

  

  const handleNav = (idx, url) => {
    if (local.menuActive !== idx) {
      local.menuActive = idx;
      local.render();
      navigate(url);
    }
  };

  const renderItems = list.map((i, idx) => {
    return (
      <MobileNavbarItem
        id={idx}
        data={i}
        action={handleNav}
        current={local.menuActive}
        key={`esensi_mobile_nav_${idx}`}
      />
    );
  });

  const renderNav = local.enable ? (
    <nav className="flex justify-evenly items-center lg:hidden fixed left-0 bottom-0 w-full h-20 py-3 bg-[#3B2C93] z-50 rounded-tl-3xl rounded-tr-3xl [&_span]:text-sm [&_svg]:h-7">
      {renderItems}
    </nav>
  ) : (
    <></>
  );
  return <>{renderNav}</>;
};
export default MobileNavbar;
