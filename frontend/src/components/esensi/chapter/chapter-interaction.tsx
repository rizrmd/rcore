import { Heart, MessageSquare, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocal } from "@/lib/hooks/use-local";
import { useSnapshot } from "valtio";
import { userState } from "@/lib/states/user-state";

interface ChapterInteractionProps {
  chapterId: string;
  bookSlug: string;
}

export function ChapterInteraction({ chapterId, bookSlug }: ChapterInteractionProps) {
  const user = useSnapshot(userState.write);
  const local = useLocal({
    liked: false,
    likeCount: 0
  });

  const handleLike = () => {
    local.liked = !local.liked;
    local.likeCount += local.liked ? 1 : -1;
    local.render();
  };

  const handleReview = () => {
    // TODO: Open review modal/form
    console.log("Open review form for chapter:", chapterId);
  };

  const handleGift = () => {
    // TODO: Open gift modal
    console.log("Open gift modal for chapter:", chapterId);
  };

  return (
    <div className="py-8">
      <div className="grid grid-cols-3 gap-8">
        
        {/* Like Button */}
        <div className="flex flex-col items-center gap-3 py-6">
          {user.user ? (
            <button
              onClick={handleLike}
              className={`flex flex-col items-center gap-3 transition-colors ${
                local.liked 
                  ? "text-red-600" 
                  : "text-gray-600 hover:text-red-600"
              }`}
            >
              <Heart className={`h-10 w-10 ${local.liked ? "fill-current" : ""}`} />
              <span className="text-base font-medium">Suka</span>
              {local.likeCount > 0 && (
                <span className="text-sm text-gray-500">{local.likeCount}</span>
              )}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Heart className="h-10 w-10" />
              <span className="text-base font-medium">Suka</span>
            </div>
          )}
        </div>

        {/* Review Button */}
        <button
          onClick={handleReview}
          className="flex flex-col items-center gap-3 py-6 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <MessageSquare className="h-10 w-10" />
          <span className="text-base font-medium">Ulasan</span>
        </button>

        {/* Gift Button */}
        <button
          onClick={handleGift}
          className="flex flex-col items-center gap-3 py-6 text-gray-600 hover:text-purple-600 transition-colors"
        >
          <Gift className="h-10 w-10" />
          <span className="text-base font-medium">Hadiah</span>
        </button>
      </div>
    </div>
  );
}