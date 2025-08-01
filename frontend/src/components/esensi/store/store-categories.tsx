import { Link } from "@/lib/router";

export type StoreCategoryItem = {
  name: string;
  slug: string;
  img?: string;
};

export const StoreCategories = ({ action, loading, list, selected }) => {
  const category_list = list.map((cat, idx) => {
    return (
      <Link
        href={`/category/${cat.slug}`}
        key={`home_categories_${idx}`}
        className={`${
          selected === cat.slug
            ? "border-b-[2px] border-b-[#1A2BC3] text-[#393B69]"
            : ""
        } hover:text-[#393B69] h-8 px-3 font-medium`}
      >
        {cat.name}
      </Link>
    );
  });

  return (
    <div className="flex w-full overflow-x-auto">
      <div className="flex flex-nowrap flex-row items-center gap-0 px-6 max-w-max h-15 text-nowrap">
        {loading ? "" : category_list}
      </div>
    </div>
  );
};
export default StoreCategories;
