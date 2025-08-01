import { ChevronLeft, Home, Bookmark, User } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/gen/chapter.esensi";
import { useSnapshot } from "valtio";
import { useLocal } from "@/lib/hooks/use-local";
import { EsensiChapterLogo } from "@/components/esensi/chapter/svg/esensi-chapter-logo";
import { useEffect } from "react";

interface ChapterFloatingNavbarProps {
  bookSlug: string;
  chapterNumber: string;
  chapterSlug: string;
}

export function ChapterFloatingNavbar({ bookSlug, chapterNumber, chapterSlug }: ChapterFloatingNavbarProps) {
  const local = useLocal({
    chapterTitle: "",
    bookTitle: "",
    scrollPercentage: 0
  }, async () => {
    try {
      const res = await api.chapter({ 
        bookSlug: bookSlug, 
        chapterNumber: chapterNumber, 
        chapterSlug: chapterSlug 
      });
      if (res?.data?.chapter?.name) {
        local.chapterTitle = res.data.chapter.name;
      }
      if (res?.data?.book?.name) {
        local.bookTitle = res.data.book.name;
      }
      local.render();
    } catch (error) {
      console.error("Failed to load chapter data:", error);
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const percentage = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
      if (local.scrollPercentage !== percentage) {
        local.scrollPercentage = percentage;
        local.render();
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href={`/title/${bookSlug}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <EsensiChapterLogo className="w-20 h-6" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {local.bookTitle && local.chapterTitle 
                    ? `${local.bookTitle} / Chapter ${chapterNumber}: ${local.chapterTitle}`
                    : "Loading..."}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
              <span className="font-medium">{local.scrollPercentage}%</span>
            </div>
            
            <Link href="/library">
              <Button variant="ghost" className="gap-2">
                <Home className="h-4 w-4" />
                Library
              </Button>
            </Link>
            
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Bookmark className="h-4 w-4" />
              ADD TO LIBRARY
            </Button>
            
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}