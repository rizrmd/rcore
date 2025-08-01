import { useEffect } from "react";
import { PaginationNumber } from "../navigation/pagination-number";
import { navigate } from "@/lib/router";
import { Breadcrumbs } from "../navigation/breadcrumbs";
import { BannerHeader } from "../ui/banner-header";
import { FilterNavigation } from "../filter/filter-navigation";
import { FilterWrapper } from "../filter/filter-wrapper";
import { BookListRenderer } from "../book/book-list-renderer";
import { NoBooksFound } from "../ui/no-books-found";
import {
  filtersStore,
  initializeFilters,
  updateFilterFromUrl,
  updateFilterItem,
  removeFilter,
  setPriceRange,
  setRatingValue,
  defaultMinPrice,
  defaultMaxPrice,
} from "@/lib/states/filters-store";

export const LayoutBookList = ({
  title = "" as string,
  loading = true as boolean,
  list = [] as any[],
  breadcrumb = [] as any[],
  pagination = {
    items: 20 as number,
    page: 1 as number,
    total_pages: 1 as number,
    url: {
      prefix: "" as string,
      suffix: "" as string,
    },
  } as any,
  isBundle = false as boolean,
  categories = [] as any[],
  authors = [] as any[],
  skipFilters = [] as any,
  banner_img = "" as string | null,
}) => {
  useEffect(() => {
    initializeFilters(categories, authors, skipFilters);
    updateFilterFromUrl();
  }, [categories, authors, skipFilters]);

  const handleUpdateFilter = (closePopup = false) => {
    if (closePopup || window.innerWidth >= 1024) {
      filtersStore.toggleFilter = false;
    }

    // Build query parameters
    const searchParams = new URLSearchParams();

    filtersStore.filters.forEach((filter) => {
      if (filter.name === "sort" && filter.selected) {
        searchParams.set("sort", filter.selected);
      } else if (filter.selected && filter.selected.length > 0) {
        if (filter.name === "cat") {
          filter.selected.forEach((value: string) => {
            searchParams.append("categories", value);
          });
        } else if (filter.name === "author") {
          filter.selected.forEach((value: string) => {
            searchParams.append("authors", value);
          });
        } else if (filter.name === "discount") {
          filter.selected.forEach((value: string) => {
            searchParams.set("discount", value);
          });
        }
      }
    });

    // Add price range if not default
    if (filtersStore.minPrice > 0) {
      searchParams.set("min_price", filtersStore.minPrice.toString());
    }
    if (filtersStore.maxPrice < 1000000) {
      searchParams.set("max_price", filtersStore.maxPrice.toString());
    }

    // Add rating if not default
    if (filtersStore.ratingValue > 0) {
      searchParams.set("rating", filtersStore.ratingValue.toString());
    }

    // Always navigate to page 1 when filters are applied
    // Extract the base path without page number
    const currentPath = window.location.pathname;
    let basePath = currentPath;

    // Remove page number from path if it exists
    if (basePath.includes("/ebook/") && basePath !== "/ebook") {
      basePath = "/ebook";
    } else if (basePath.includes("/book/") && basePath !== "/book") {
      basePath = "/book";
    } else if (basePath.includes("/search/")) {
      // For search, keep the search term but remove page number
      const pathParts = basePath.split("/");
      if (
        pathParts.length > 3 &&
        pathParts[3] &&
        !isNaN(parseInt(pathParts[3]))
      ) {
        // Remove the page number part
        basePath = `/${pathParts[1]}/${pathParts[2]}`;
      }
    } else if (basePath.includes("/category/")) {
      // For category, keep the category slug but remove page number
      const pathParts = basePath.split("/");
      if (
        pathParts.length > 3 &&
        pathParts[3] &&
        !isNaN(parseInt(pathParts[3]))
      ) {
        // Remove the page number part
        basePath = `/${pathParts[1]}/${pathParts[2]}`;
      }
    } else if (basePath.includes("/bundles/") && basePath !== "/bundles") {
      basePath = "/bundles";
    }

    // Navigate to the base path with filters (page 1)
    const newUrl = searchParams.toString()
      ? `${basePath}?${searchParams.toString()}`
      : basePath;

    navigate(newUrl);
  };

  const handleFilterItem = (
    idx: number,
    value: any,
    single = false as boolean
  ) => {
    updateFilterItem(idx, value, single);

    // Always update URL for category and other filters, but keep popup open on mobile
    handleUpdateFilter();
  };

  const handleRemoveFilter = (filterName: string, value?: string) => {
    if (filterName === "price") {
      setPriceRange(defaultMinPrice, defaultMaxPrice);
    } else if (filterName === "rating") {
      setRatingValue(0);
    } else {
      removeFilter(filterName, value);
    }
    handleUpdateFilter(true);
  };

  const renderPagination = (
    <>
      <PaginationNumber
        items_per_page={pagination?.items}
        current={pagination?.page}
        total_pages={pagination?.total_pages}
        url={pagination?.url}
      />
    </>
  );

  const columnsClasses = isBundle
    ? "[&>.esensi-book]:w-1/2 lg:[&>.esensi-book]:w-1/4"
    : "[&>.esensi-book]:w-1/2 lg:[&>.esensi-book]:w-1/4";

  return (
    <div className="flex flex-col w-full items-center lg:gap-8">
      <BannerHeader title={title} bannerImg={banner_img} />
      <div className="flex flex-col w-full max-w-[1200px] gap-4">
        <div className="hidden lg:flex w-full justify-start">
          <Breadcrumbs data={breadcrumb} />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-start py-8 gap-5">
          <div className="flex flex-col w-full shrink-0 lg:w-1/4 lg:gap-6">
            <div className="flex flex-wrap gap-1 px-4 lg:hidden">
              <FilterNavigation onRemoveFilter={handleRemoveFilter} loading={loading} />
            </div>
            <FilterWrapper
              onFilterItem={handleFilterItem}
              onUpdateFilter={handleUpdateFilter}
            />
          </div>

          <div className="flex flex-col justify-center gap-6 lg:grow-1">
            <div
              className={`flex flex-wrap justify-start gap-y-4 px-2 w-full ${columnsClasses}`}
            >
              <BookListRenderer
                list={list}
                loading={loading}
                isBundle={isBundle}
                noBooks={<NoBooksFound />}
              />
            </div>
            <div className="flex justify-center px-4">{renderPagination}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LayoutBookList;
