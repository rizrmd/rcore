import { Link } from "@/lib/router";

export const CategoryList = ({
  data = [] as any[] | null,
  id = null as any | null,
  className = null as any | null,
  hideTitle = false as boolean,
}) => {
  if (id == null || id == "") {
    const n = Math.floor(Math.random() * 11);
    const k = Math.floor(Math.random() * 1000000);
    id = String.fromCharCode(n) + k;
  }

  const cats = data?.map((cat, idx) => {
    return (
      <Link
        href={`/category/${cat?.slug}`}
        key={`esensi_cat_${id}_${cat?.slug}_${idx}`}
      >
        {cat?.name}
      </Link>
    );
  });

  const renderCategories = data && data.length > 0 && (
    <div
      className={`flex flex-col w-full items-start gap-3 ${
        className !== null ? className : ""
      }`}
    >
      {!hideTitle && (
        <h4 className="text-[#383D6480] text-xs font-bold">Kategori:</h4>
      )}
      <div className="relative w-full lg:overflow-visible min-h-[30px]">
        <div className="absolute inset-x-0 overflow-x-auto scrollbar-hide lg:relative lg:h-auto lg:flex lg:flex-wrap -mr-6 pb-2 lg:pb-0 lg:mr-0">
          <div className="flex items-center gap-2 lg:gap-3 h-full [&>a]:bg-[#E1E5EF] [&>a]:text-[#383D64] lg:[&>a]:hover:bg-[#383D64] lg:[&>a]:hover:text-white [&>a]:rounded-full [&>a]:font-semibold [&>a]:px-5 [&>a]:py-2 [&>a]:text-xs [&>a]:transition-color [&>a]:whitespace-nowrap [&>a]:flex-shrink-0">
            {cats}
          </div>
        </div>
      </div>
    </div>
  );

  return <>{renderCategories}</>;
};
export default CategoryList;
