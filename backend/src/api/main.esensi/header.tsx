import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface MenuItem {
  label: string;
  url: string;
  newtab: boolean;
  submenu: MenuItem[] | null;
}

interface HeaderResponse {
  jsx: ReactElement;
  data: {
    logo: {
      img: string;
      alt: string;
    };
    searchbar: {
      placeholder: string;
    };
    menu: MenuItem[];
  };
}

export default defineAPI({
  name: "header",
  url: "/api/header",
  async handler(): Promise<HeaderResponse> {
    const logo = {
      img: `/_file/upload/esensi-online-logo.png`,
      alt: `Esensi Online`,
    };

    const searchbar = {
      placeholder: `Cari buku...`,
    };

    const genres = await db.genre.findMany({
      where: {
        deleted_at: null,
        id_parent: null,
      },
      include: {
        other_genre: {
          where: {
            deleted_at: null,
            NOT: {
              id_parent: null,
            },
          },
          include: {
            other_genre: {
              where: {
                deleted_at: null,
                NOT: {
                  id_parent: null,
                },
              },
            },
          },
        },
      },
    });

    const buildMenu = (menu: any) => {
      return menu.map((item: any) => {
        const submenu =
          item?.other_genre && item.other_genre.length > 0
            ? buildMenu(item.other_genre)
            : null;
        return {
          label: item.name,
          url: `/genre/${item.slug}`,
          newtab: false,
          submenu: submenu,
        };
      });
    };

    const menu_genres = buildMenu(genres);

    const menuItems = [
      {
        label: "Genre",
        url: "/genre",
        newtab: false,
        submenu: menu_genres,
      },
      {
        label: "Buku Fisik",
        url: "/book",
        newtab: false,
        submenu: null,
      },
      {
        label: "Bundle Hemat",
        url: "/bundles",
        newtab: false,
        submenu: null,
      },
      {
        label: "Tentang Esensi",
        url: "/about",
        newtab: false,
        submenu: null,
      },
    ];

    const data = {
      logo: logo,
      searchbar: searchbar,
      menu: menuItems,
    };

    return {
      jsx: <></>,
      data: data,
    };
  },
});
