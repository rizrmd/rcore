import { cn } from "@/lib/utils";
import { useState } from "react";

interface CoverImageProps {
  src?: string;
  title: string;
  author: string;
  className?: string;
  alt?: string;
}

export function CoverImage({ src, title, author, className, alt }: CoverImageProps) {
  const [imageError, setImageError] = useState(false);

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt || title}
        className={cn("object-cover", className)}
        onError={() => setImageError(true)}
      />
    );
  }

  // Generate cover from title and author
  const getInitials = (text: string) => {
    const words = text.split(" ");
    if (words.length === 1) {
      return text.slice(0, 2).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  // Generate consistent color based on title
  const generateColor = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const backgroundColor = generateColor(title);
  const titleInitials = getInitials(title);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-white font-medium",
        className
      )}
      style={{ backgroundColor }}
    >
      <div className="text-3xl font-bold mb-2">{titleInitials}</div>
      <div className="text-xs text-center px-4 opacity-90">
        <div className="line-clamp-2 font-semibold">{title}</div>
        <div className="line-clamp-1 mt-1">{author}</div>
      </div>
    </div>
  );
}