import { Link } from "@/lib/router";

export const ProfileLinks = ({ label, url, newtab = false, icon = null as any | null, className = null as string | null }) => {
  return (
    <Link href={url} className={`flex w-full h-10 justify-start items-center font-bold gap-2 p-2 rounded-md ${className !== null ? className :"text-[#3B2C93]" }`} target={newtab ? "_blank" : "_self"}>
      {icon !== null && icon}
      <span>{label}</span>
    </Link>
  );
};
export default ProfileLinks;
