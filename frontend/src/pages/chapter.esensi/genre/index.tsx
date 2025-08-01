import { api } from "@/lib/gen/chapter.esensi";
import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";

interface GenreCardProps {
  genre: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    book_count: number;
  };
}

const GenreCard = ({ genre }: GenreCardProps) => (
  <div className="bg-white rounded-lg border hover:shadow-md transition-shadow duration-200">
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{genre.name}</h3>
      {genre.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{genre.description}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{genre.book_count} buku</span>
        <a
          href={`/genre/${genre.slug}`}
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          Lihat Semua →
        </a>
      </div>
    </div>
  </div>
);

export default (data: Awaited<ReturnType<typeof api.genres>>["data"]) => {
  const genres = data?.genres || [];
  
  return (
    <EsensiChapterLayout>
      <div className="w-full min-h-screen bg-gray-50">
        <div className="esensi-container mx-auto pt-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {data?.title || "Daftar Genre Web Novel"}
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Jelajahi berbagai genre web novel di Esensi Online. Temukan cerita favorit dari romance, fantasy, action, dan genre lainnya!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {genres.map((genre) => (
              <GenreCard key={genre.id} genre={genre} />
            ))}
          </div>
        </div>
      </div>
    </EsensiChapterLayout>
  );
};