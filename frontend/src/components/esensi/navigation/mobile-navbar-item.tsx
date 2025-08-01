import { Link } from "@/lib/router";

export const MobileNavbarItem = ({ id, data, action, current }) => {
  return (
    <Link
      href={data.url}
      onClick={(e) => {
        e.preventDefault();
        action(id, data.url);
      }}
      className={`flex flex-col justify-between items-center gap-1 ${id === current ? "text-white" : "text-[#5965D2]"}`}
    >
      {data.icon}
      <span>{data.label}</span>
    </Link>
  );
};
export default MobileNavbarItem;
