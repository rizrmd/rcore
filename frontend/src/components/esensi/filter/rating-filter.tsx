import { useSnapshot } from "valtio";
import { StarRating } from "@/components/ui/star-rating";
import { filtersStore, setRatingValue } from "@/lib/states/filters-store";

export const RatingFilter = () => {
  const filtersState = useSnapshot(filtersStore);

  return (
    <div className="flex flex-col items-start w-full gap-2.5">
      <strong className="flex font-bold">Rating Minimal</strong>
      <div className="w-full">
        <StarRating
          value={filtersState.ratingValue}
          onValueChange={(value) => setRatingValue(value)}
          max={5}
          size={24}
          className="justify-start"
        />
      </div>
    </div>
  );
};export default RatingFilter;
