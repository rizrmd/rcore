import { defineAPI } from "rlib/server";

interface MenuItem {
  label: string;
  url: string;
  newtab: boolean;
  submenu: MenuItem[] | null;
  icon?: string;
}

interface HeaderResponse {
  data: {
    logo: {
      img: string;
      alt: string;
    };
    menu: MenuItem[];
  };
}

export default defineAPI({
  name: "header",
  url: "/api/header",
  async handler(): Promise<HeaderResponse> {
    // Fetch genres directly from database
    const genres = await db.genre.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        id_parent: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Fetch categories directly from database (simplified to avoid relationship errors)
    const categories = await db.category.findMany({
      where: {
        deleted_at: null,
		is_chapter: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        id_parent: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Build hierarchical structure for genres
    const genreMap = new Map<string, any>();
    const rootGenres: any[] = [];

    // First pass: Create all genre objects
    genres.forEach((genre) => {
      genreMap.set(genre.id, {
        ...genre,
        children: [],
      });
    });

    // Second pass: Build parent-child relationships
    genres.forEach((genre) => {
      const genreObj = genreMap.get(genre.id)!;
      
      if (genre.id_parent) {
        const parent = genreMap.get(genre.id_parent);
        if (parent) {
          parent.children.push(genreObj);
        }
      } else {
        // This is a root genre
        rootGenres.push(genreObj);
      }
    });

    // Build hierarchical structure for categories
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];

    // First pass: Create all category objects
    categories.forEach((category) => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
      });
    });

    // Second pass: Build parent-child relationships
    categories.forEach((category) => {
      const categoryObj = categoryMap.get(category.id)!;
      
      if (category.id_parent) {
        const parent = categoryMap.get(category.id_parent);
        if (parent) {
          parent.children.push(categoryObj);
        }
      } else {
        // This is a root category
        rootCategories.push(categoryObj);
      }
    });

    // Convert genres to menu items
    const genreMenuItems = rootGenres.map((genre) => convertGenreToMenuItem(genre));
    
    // Convert categories to menu items
    const categoryMenuItems = rootCategories.map((category) => convertCategoryToMenuItem(category));
    const logoImg = `/_file/upload/esensi-online-logo.png`;

    const menuItems = [
      {
        label: "Jelajahi",
        url: "/browse",
        newtab: false,
        submenu: null,
      },
      {
        label: "Genre",
        url: "/genre",
        newtab: false,
        submenu: genreMenuItems.length > 0 ? genreMenuItems : null,
      },
      {
        label: "Buat karyamu",
        url: "/create",
        newtab: false,
        submenu: null,
        icon: "Pencil",
      },
    ];

    const data = {
      logo: {
        img: logoImg,
        alt: "Esensi Chapter",
      },
      menu: menuItems,
    };
    return {
      data: data,
    };
  },
});

// Helper function to convert genre to menu item
function convertGenreToMenuItem(genre: any): MenuItem {
  return {
    label: genre.name,
    url: genre.slug ? `/genre/${genre.slug}` : "#",
    newtab: false,
    submenu: genre.children && genre.children.length > 0 
      ? genre.children.map((child: any) => convertGenreToMenuItem(child))
      : null,
  };
}

// Helper function to convert category to menu item
function convertCategoryToMenuItem(category: any): MenuItem {
  return {
    label: category.name,
    url: category.slug ? `/category/${category.slug}` : "#",
    newtab: false,
    submenu: category.children && category.children.length > 0 
      ? category.children.map((child: any) => convertCategoryToMenuItem(child))
      : null,
  };
}
