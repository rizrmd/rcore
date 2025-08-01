import { Link } from "@/lib/router";

export const GenreItem = ({data}) => {
    return (
        <Link href={`/genre/${data?.slug}`} className="text-(--esensi-color) bg-[#EAECFF] text-sm font-medium py-2 px-4 rounded-sm shadow-md transition-colors hover:bg-(--esensi-color) hover:text-(--esensi-color-i) whitespace-nowrap">{data?.name}</Link>
    );
}