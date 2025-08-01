import { BookCardLoading } from "./book-card-loading";
import { BundleListItem } from "./bundle-list-item";


export const BundleProducts = ({loading, list }) => {
  const retreiveBooks = !loading && list.map((book, idx) => {
   
    return <BundleListItem data={book?.product} key={`store_books_${idx}`} />;
  });

  const noBooks = !loading && (
    <div className="flex flex-col justify-center items-center gap-4 w-full h-auto py-10 px-4 relative">

    </div>
  );
  const renderBooks = list.length > 0 ? retreiveBooks : noBooks;

  const renderBooksLoading = Array.from({ length: 3 }, (_, idx) => {
    return <BookCardLoading key={`store_books_loading_${idx}`} />;
  });

  return (
    <div className="flex w-full overflow-x-auto">
      <div className="flex flex-row justify-start items-stretch gap-y-4 w-auto [&>.esensi-book-loading]:w-auto [&>div:not(.esensi-book-loading)]:mx-4">
        {loading ? renderBooksLoading : renderBooks}
      </div>
    </div>
  );
};
export default BundleProducts;
