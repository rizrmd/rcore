import { api } from "@/lib/gen/chapter.esensi";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link, navigate } from "@/lib/router";
import { BookCard } from "@/components/esensi/chapter/book/book-card";
import { BookCardUpdated } from "@/components/esensi/chapter/book/book-card-updated";
import { GenreItem } from "@/components/esensi/chapter/ui/genre-item";
import { TagItem } from "@/components/esensi/chapter/ui/tag-item";
import { Button } from "@/components/ui/button";
import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { HeroImage } from "@/components/esensi/chapter/svg/hero-image";

export default (data: Awaited<ReturnType<(typeof api)["index"]>>["data"]) => {
  const local = {
    books_lastest: data?.books_lastest || [],
    books_updated: data?.books_updated || [],
    genre: data?.genre || [],
    tags: data?.tags || [],
  };

  const sectionTitleClasses =
    "flex justify-between w-full text-(--esensi-color) text-lg font-semibold mb-4 border-b border-[#8D93CE] pb-3 mt-6";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get("search") as string;
    if (searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(searchQuery)}`);
    }
  };

  const sectionSearch = (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--esensi-color)" />
        <Input
          name="search"
          placeholder="Cari novel, penulis, atau genre..."
          className="w-full pl-10 bg-[#EAECFF] text-(--esensi-color) border-none"
          autoComplete="off"
        />
      </div>
    </form>
  );

  const sectionHero = (
    <div className="flex w-full flex-col lg:flex-row lg:justify-between items-center gap-10 bg-[#EAECFF] rounded-lg p-10 lg:my-10">
      <div className="flex flex-col items-start gap-4">
        <h4 className="text-2xl font-semibold text-(--esensi-color)">
          Selamat datang di Esensi
        </h4>
        <p className="text-sm text-(--esensi-color) lg:max-w-[400px]">
          Buat, terbitkan, dan bagikan dunia Anda — satu bab dalam satu waktu.
          Tanpa batas. Hanya imajinasi Anda.
        </p>
        <strong className="text-(--esensi-color)">
          Buat dunia Anda sekarang!
        </strong>
        <Link
          href="/create"
          className="esensi-button w-auto text-md py-1.5 px-5 -ml-2.5"
        >
          Mulai Menulis!
        </Link>
      </div>
      <div className="lg:w-[300px] lg:-m-10 scale-120 flex justify-center [&_svg]:w-full [&_svg]:h-auto">
        <HeroImage />
      </div>
    </div>
  );

  const sectionLastest = local.books_lastest?.length > 0 && (
    <div className="flex flex-col gap-4">
      <h3 className={sectionTitleClasses}>
        <span>Buku Terbaru</span>
      </h3>
      <div className="w-full overflow-x-auto esensi-scrollbar">
        <div className="flex flex-nowrap justify-start relative pb-4 gap-6 [&>div]:p-0 [&>div]:w-[150px] [&>div]:flex-shrink-0 min-w-0">
          {local.books_lastest.map((book, idx) => (
            <BookCard key={book.slug} data={book} />
          ))}
        </div>
      </div>
    </div>
  );

  const sectionUpdated = local.books_updated?.length > 0 && (
    <div className="flex w-full flex-col gap-4">
      <h3 className={sectionTitleClasses}>
        <span>Terbaru Diperbarui</span>
        <Button size={"sm"} className="esensi-button">
          Lihat semua
        </Button>
      </h3>
      <div className="w-full relative lg:overflow-x-auto">
        <div className="flex w-auto flex-wrap justify-between lg:justify-start relative -mx-3 lg:mx-0 [&>a]:w-1/2 [&>a]:p-3 lg:[&>a]:p-4 lg:[&>a]:w-1/4">
          {local.books_updated.map((book, idx) => (
            <BookCardUpdated key={book.slug} data={book} />
          ))}
        </div>
      </div>
    </div>
  );

  const sectionTags = local.tags?.length > 0 && (
    <div className="flex w-full flex-col gap-4">
      <h3 className={sectionTitleClasses}>
        <span>Tag Terpopuler</span>
      </h3>
      <div className="flex flex-wrap gap-3 w-full relative">
        {local.tags.map((tag, idx) => (
          <TagItem key={`esensi-top-tag-${idx}`} data={tag} />
        ))}
      </div>
    </div>
  );

  const sectionCompleted = local.books_lastest?.length > 0 && (
    <div className="flex w-full flex-col gap-4">
      <h3 className={sectionTitleClasses}>
        <span>Novel Selesai</span>
      </h3>
      <div className="w-full overflow-x-auto esensi-scrollbar">
        <div className="flex flex-nowrap justify-start relative pb-4 gap-6 [&>div]:p-0 [&>div]:w-[150px] [&>div]:flex-shrink-0 min-w-0">
          {local.books_lastest.map((book, idx) => (
            <BookCard key={book.slug} data={book} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <EsensiChapterLayout>
      <div className="esensi-container">
        <div className="flex flex-col w-full gap-6">
          {sectionSearch}
          {sectionHero}
          {sectionLastest}
          {sectionUpdated}
          {sectionTags}
          {sectionCompleted}
        </div>
      </div>
    </EsensiChapterLayout>
  );
};
