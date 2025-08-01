import { useLocal } from "@/lib/hooks/use-local";
import { Link } from "@/lib/router";
import { useEffect } from "react";

export const PaginationNumber = ({
  items_per_page = 1 as number,
  current = 1 as number,
  total_pages = 1 as number,
  url,
}) => {
  const local = useLocal(
    {
      current: current,
      total_pages: total_pages,
      maxlist: 5,
      items: items_per_page,
      url_prefix: "" as string,
      url_suffix: "" as string,
      visible_pages: [] as any[],
    },
    async () => {
      if (typeof url === "string") {
        local.url_prefix = url;
      } else {
        if (url?.prefix) {
        local.url_prefix = url.prefix;
        }
        if (url?.suffix) {
          
          local.url_suffix = `${url.suffix}`;
        }
      }
      local.visible_pages = getPaginationRange(
        current,
        total_pages,
        local.maxlist
      );
      local.render();
    }
  );

  // Update local state when props change
  useEffect(() => {
    local.current = current;
    local.total_pages = total_pages;
    local.items = items_per_page;
    
    if (typeof url === "string") {
      local.url_prefix = url;
    } else {
      if (url?.prefix) {
        local.url_prefix = url.prefix;
      }
      if (url?.suffix) {
        local.url_suffix = `${url.suffix}`;
      }
    }
    
    local.visible_pages = getPaginationRange(
      current,
      total_pages,
      local.maxlist
    );
    local.render();
  }, [current, total_pages, items_per_page, url]);

  const getPaginationRange = (
    currentPage: number,
    totalPages: number,
    visibleLinks: number
  ) => {
    if (totalPages <= visibleLinks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfLinks = Math.floor(visibleLinks / 2);
    let start = Math.max(currentPage - halfLinks, 1);
    let end = Math.min(currentPage + halfLinks, totalPages);

    if (start === 1) {
      end = Math.min(visibleLinks, totalPages);
    }

    if (end === totalPages) {
      start = Math.max(totalPages - visibleLinks + 1, 1);
    }

    let range = [] as any[];
    if (start > 1) {
      range.push(1, "...");
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    if (end < totalPages) {
      range.push("...", totalPages);
    }
    return range;
  };
  const buildPageUrl = (pageNum: number) => {
    // Get current URL search params
    const currentParams = new URLSearchParams(window.location.search);
    
    // Check if URL structure includes page in path or as query param
    const isPageInPath = local.url_prefix && !local.url_prefix.includes('?');
    
    if (isPageInPath) {
      // Page number is part of the URL path (e.g., /ebook/2)
      // Keep existing query params
      const queryString = currentParams.toString();
      return `${local.url_prefix}${pageNum}${local.url_suffix}${queryString ? '?' + queryString : ''}`;
    } else {
      // Page number should be a query parameter (e.g., /browse?page=2)
      // Update or add page parameter
      currentParams.set('page', pageNum.toString());
      const queryString = currentParams.toString();
      return `${local.url_prefix}${queryString ? '?' + queryString : ''}`;
    }
  };
  
  const prev = local.current !== 1 && local.total_pages !== 1 ? (
    <Link href={buildPageUrl(local.current - 1)} className="flex px-3">« Prev page</Link>
  ) : (
    <span className="flex grow-1 border-none opacity-0 lg:hidden"></span>
  );
  const next = local.current !== local.total_pages ? (
    <Link href={buildPageUrl(local.current + 1)} className="flex px-3">Next page »</Link>
  ) : (
    <span className="flex grow-1 border-none opacity-0 lg:hidden"></span>
  );

  const list = local.visible_pages.map((p, idx) => {
    let the_page = <></>;
    const classes = "hidden lg:flex";
    if (p == local.current) {
      the_page = (
        <span key={`esensi_pagenumber_${idx}`} className={`${classes} text-white font-semibold bg-[#3b2c93] cursor-default border-[#3b2c93] pointer-events-none`}>
          {p}
        </span>
      );
    } else if (p == "...") {
      the_page = (
        <span key={`esensi_pagenumber_${idx}`} className={`${classes} text-[#3b2c93] font-semibold cursor-default`}>
          {p}
        </span>
      );
    } else {
      the_page = (
        <Link
          href={buildPageUrl(p)}
          className={classes}
          key={`esensi_pagenumber_${idx}`}
        >
          {p}
        </Link>
      );
    }
    return the_page;
  });

  const renderPagination = local.total_pages > 1 && (
    <ul className="flex w-full justify-between lg:justify-center items-center gap-2 [&>*]:transition-all [&>*]:h-10 [&>*]:min-w-10 [&>*]:border-2 [&>*]:border-[#E1E5EF] [&>*]:justify-center [&>*]:items-center [&>a]:bg-[#E1E5EF] [&>a]:hover:bg-[#3b2c93] [&>a]:hover:border-[#3b2c93] [&>a]:hover:text-white [&>*]:rounded-md [&>span]:pointer-events-none">
      {prev}
      {list}
      {next}
    </ul>
  );

  return <>{renderPagination}</>;
};
export default PaginationNumber;
