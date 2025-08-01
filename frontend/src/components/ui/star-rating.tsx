import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onValueChange?: (value: number) => void;
  max?: number;
  size?: number;
  className?: string;
  readonly?: boolean;
}

const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  ({ value, onValueChange, max = 5, size = 20, className, readonly = false }, ref) => {
    const [hoverValue, setHoverValue] = React.useState(0);

    const handleClick = (rating: number) => {
      if (!readonly && onValueChange) {
        onValueChange(rating);
      }
    };

    const handleMouseEnter = (rating: number) => {
      if (!readonly) {
        setHoverValue(rating);
      }
    };

    const handleMouseLeave = () => {
      if (!readonly) {
        setHoverValue(0);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1", className)}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: max }, (_, i) => {
          const rating = i + 1;
          const isActive = rating <= (hoverValue || value);
          
          return (
            <Star
              key={i}
              size={size}
              className={cn(
                "transition-colors duration-150",
                isActive 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300 hover:text-yellow-400",
                !readonly && "cursor-pointer"
              )}
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
            />
          );
        })}
        {!readonly && (
          <span className="ml-2 text-sm text-gray-600">
            {value > 0 ? `${value}+ bintang` : "Semua rating"}
          </span>
        )}
      </div>
    );
  }
);

StarRating.displayName = "StarRating";

export { StarRating };