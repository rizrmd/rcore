import { proxy } from "valtio";

export interface FilterOption {
  label: string;
  value: string;
}

export interface Filter {
  name: string;
  label: string;
  options: FilterOption[];
  selected: any;
}

export interface SelectedFilter {
  type: "sort" | "category" | "author" | "discount" | "rating";
  filterName: string;
  value: string;
  label: string;
}

export interface FiltersState {
  filters: Filter[];
  selectedFilters: SelectedFilter[];
  toggleFilter: boolean;
  skipFilters: any[];
  minPrice: number;
  maxPrice: number;
  ratingValue: number;
}

export const defaultMinPrice = 0;
export const defaultMaxPrice = 9000000;
export const filtersStore = proxy<FiltersState>({
  filters: [],
  selectedFilters: [],
  toggleFilter: false,
  skipFilters: [],
  minPrice: defaultMinPrice,
  maxPrice: defaultMaxPrice,
  ratingValue: 0,
});

export const initializeFilters = (
  categories: any[],
  authors: any[],
  skipFilters: any[]
) => {
  filtersStore.skipFilters = skipFilters;
  filtersStore.filters = [
    {
      name: "sort",
      label: "Urutkan",
      options: [
        { value: "newest", label: "Terbaru" },
        { value: "oldest", label: "Terlama" },
        { value: "highest_price", label: "Termahal" },
        { value: "lower_price", label: "Termurah" },
        { value: "highest_rating", label: "Rating terbanyak" },
        { value: "lowest_rating", label: "Rating terendah" },
      ],
      selected: "newest",
    },
    {
      name: "cat",
      label: "Kategori",
      options: categories.map((cat: any) => ({
        label: cat.name || '',
        value: cat.slug || '',
      })).filter((option: any) => option.label && option.value),
      selected: [],
    },
    {
      name: "discount",
      label: "Diskon",
      options: [{ label: "Buku yang sedang diskon", value: "discounted" }],
      selected: [],
    },
  ];
};

export const updateFilterFromUrl = () => {
  // Safety check - ensure filters are initialized
  if (!filtersStore.filters || filtersStore.filters.length === 0) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);

  // Set sort filter
  const sortValue = urlParams.get("sort");
  if (sortValue) {
    const sortFilter = filtersStore.filters.find((f) => f.name === "sort");
    if (sortFilter) {
      sortFilter.selected = sortValue;
    }
  }

  // Set category filters
  const categoryValues = urlParams.getAll("categories");
  if (categoryValues.length > 0) {
    const categoryFilter = filtersStore.filters.find((f) => f.name === "cat");
    if (categoryFilter) {
      categoryFilter.selected = categoryValues;
    }
  }

  // Set author filters
  const authorValues = urlParams.getAll("authors");
  if (authorValues.length > 0) {
    const authorFilter = filtersStore.filters.find((f) => f.name === "author");
    if (authorFilter) {
      authorFilter.selected = authorValues;
    }
  }

  // Set discount filter
  const discountValue = urlParams.get("discount");
  if (discountValue) {
    const discountFilter = filtersStore.filters.find(
      (f) => f.name === "discount"
    );
    if (discountFilter) {
      discountFilter.selected = [discountValue];
    }
  }

  // Set rating filter
  const ratingValue = urlParams.get("rating");
  if (ratingValue) {
    // Only set the rating slider value
    filtersStore.ratingValue = parseInt(ratingValue);
  }

  // Set price range
  const minPrice = urlParams.get("min_price");
  const maxPrice = urlParams.get("max_price");
  if (minPrice) {
    filtersStore.minPrice = parseInt(minPrice);
  }
  if (maxPrice) {
    filtersStore.maxPrice = parseInt(maxPrice);
  }

  // Update the selected filters list after setting all values from URL
  updateFilteredList();
};

export const toggleFilterPopup = () => {
  filtersStore.toggleFilter = !filtersStore.toggleFilter;
};

export const setFilterPopup = (isOpen: boolean) => {
  filtersStore.toggleFilter = isOpen;
};

export const updateFilterItem = (idx: number, value: any, single = false) => {
  // Safety check - ensure filters are initialized and index is valid
  if (
    !filtersStore.filters ||
    filtersStore.filters.length === 0 ||
    idx >= filtersStore.filters.length
  ) {
    return;
  }

  if (single) {
    filtersStore.filters[idx].selected = value;
  } else {
    if (filtersStore.filters[idx].selected.includes(value)) {
      filtersStore.filters[idx].selected = filtersStore.filters[
        idx
      ].selected.filter((item: any) => item !== value);
    } else {
      filtersStore.filters[idx].selected.push(value);
    }
  }

  // Update the selected filters list
  updateFilteredList();
};

export const removeFilter = (filterName: string, value?: string) => {
  // Safety check - ensure filters are initialized
  if (!filtersStore.filters || filtersStore.filters.length === 0) {
    return;
  }

  const filterIndex = filtersStore.filters.findIndex(
    (f) => f.name === filterName
  );
  if (filterIndex !== -1) {
    const filter = filtersStore.filters[filterIndex];

    if (filterName === "sort") {
      // Reset sort to default (newest)
      filter.selected = "newest";
    } else if (value) {
      // Remove specific value from array
      filter.selected = filter.selected.filter(
        (item: string) => item !== value
      );
    } else {
      // Clear all values for this filter
      filter.selected = [];
    }

    // Update the selected filters list
    updateFilteredList();
  }
};

export const setPriceRange = (minPrice: number, maxPrice: number) => {
  filtersStore.minPrice = minPrice;
  filtersStore.maxPrice = maxPrice;
  updateFilteredList();
};

export const setRatingValue = (rating: number) => {
  filtersStore.ratingValue = rating;
  updateFilteredList();
};

export const clearAllFilters = () => {
  // Reset all filters to default values
  filtersStore.filters.forEach((filter) => {
    if (filter.name === "sort") {
      filter.selected = "newest";
    } else {
      filter.selected = [];
    }
  });

  // Reset price range and rating
  filtersStore.minPrice = defaultMinPrice;
  filtersStore.maxPrice = defaultMaxPrice;
  filtersStore.ratingValue = 0;

  updateFilteredList();
};

export const updateFilteredList = () => {
  const selectedFilters: SelectedFilter[] = [];

  filtersStore.filters.forEach((filter) => {
    if (filter.name === "sort" && filter.selected !== "newest") {
      // Show sort filter if not default
      const sortOption = filter.options.find(
        (opt: any) => opt.value === filter.selected
      );
      if (sortOption) {
        selectedFilters.push({
          type: "sort",
          filterName: "sort",
          value: filter.selected,
          label: sortOption.label,
        });
      }
    } else if (
      filter.selected &&
      Array.isArray(filter.selected) &&
      filter.selected.length > 0
    ) {
      // Show array-based filters (categories, authors, discount, ratings)
      filter.selected.forEach((selectedValue: string) => {
        const option = filter.options.find(
          (opt: any) => opt.value === selectedValue
        );
        if (option) {
          let type: SelectedFilter["type"] = "category";
          if (filter.name === "author") type = "author";
          else if (filter.name === "discount") type = "discount";
          else if (filter.name === "ratings") type = "rating";

          selectedFilters.push({
            type,
            filterName: filter.name,
            value: selectedValue,
            label: option.label,
          });
        }
      });
    }
  });

  // Add price range filter if not default
  if (
    filtersStore.minPrice > defaultMinPrice ||
    filtersStore.maxPrice < defaultMaxPrice
  ) {
    let priceLabel = "Harga: ";
    let priceValue = "";

    if (
      filtersStore.minPrice > defaultMinPrice &&
      filtersStore.maxPrice < defaultMaxPrice
    ) {
      // Both min and max are set
      priceLabel += `Rp ${filtersStore.minPrice.toLocaleString()} - Rp ${filtersStore.maxPrice.toLocaleString()}`;
      priceValue = `${filtersStore.minPrice}-${filtersStore.maxPrice}`;
    } else if (filtersStore.minPrice > defaultMinPrice) {
      // Only min price is set
      priceLabel += `Min: Rp ${filtersStore.minPrice.toLocaleString()}`;
      priceValue = `${filtersStore.minPrice}-`;
    } else if (filtersStore.maxPrice < defaultMaxPrice) {
      // Only max price is set
      priceLabel += `Max: Rp ${filtersStore.maxPrice.toLocaleString()}`;
      priceValue = `-${filtersStore.maxPrice}`;
    }

    selectedFilters.push({
      type: "category",
      filterName: "price",
      value: priceValue,
      label: priceLabel,
    });
  }

  // Add rating filter if not default
  if (filtersStore.ratingValue > 0) {
    selectedFilters.push({
      type: "rating",
      filterName: "rating",
      value: filtersStore.ratingValue.toString(),
      label: `Rating: ${filtersStore.ratingValue}+ bintang`,
    });
  }

  filtersStore.selectedFilters = selectedFilters;
};
