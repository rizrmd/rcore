import { BookCardLoading } from "../book/book-card-loading";
import { BookCard } from "../book/book-card";
import { CircleArrowLeft, CircleArrowRight } from "lucide-react";

export const StoreFeaturedProducts = ({loading, data, animated}) => {

    const renderLoading = Array.from({ length: 5 }, (_, idx) => {
        return <BookCardLoading key={`store_featured_books_loading_${idx}`} />;
      });

    const renderBooks = data.map((book, idx) => {
        return <BookCard data={book} key={`esensi_featured_item_${idx}`}/>
    });

    return (
        <div className="flex justify-between w-full relative">
            
            <div className={`flex gap-6 relative overflow-x-auto`}>
                <div className={`w-auto flex [&>a,&>div]:w-[180px] ${animated ? "transition-all" : ""} relative`}>
                    {loading? renderLoading : renderBooks }
                </div>
            </div>
            
        </div>
    );
};export default StoreFeaturedProducts;
