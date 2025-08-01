import React, { type ReactNode } from "react";
import { ChapterFloatingNavbar } from "./chapter-floating-navbar";
import { ChapterSideNavbar } from "./chapter-side-navbar";

interface ChapterLayoutProps {
  children: ReactNode;
  bookSlug: string;
  chapterNumber: string;
  chapterSlug: string;
  bookId?: string;
  chapterId?: string;
}

export function ChapterLayout({ children, bookSlug, chapterNumber, chapterSlug, bookId, chapterId }: ChapterLayoutProps) {
  const layoutStyle = {
    "--esensi-color": "#3B2C93",
    "--esensi-color-alt": "#44B5A9",
    "--esensi-color-i": "#ffffff",
    "--esensi-container-w": "1200px",
    "--esensi-container-px": "calc(var(--spacing) * 4)",
    "--esensi-container-px__lg": "0",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50" style={layoutStyle}>
      <ChapterFloatingNavbar 
        bookSlug={bookSlug}
        chapterNumber={chapterNumber}
        chapterSlug={chapterSlug}
      />
      
      <ChapterSideNavbar 
        bookSlug={bookSlug}
        chapterNumber={chapterNumber}
        chapterSlug={chapterSlug}
        bookId={bookId}
        chapterId={chapterId}
      />
      
      <main className="p-4 md:p-8 mt-16 mb-20 md:mb-0">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}