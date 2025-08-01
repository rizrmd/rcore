import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { BookCard } from "../book/book-card";
import { ArrowRight, Frown } from "lucide-react";
import type { FC } from "react";
import { BookCardLoading } from "../book/book-card-loading";
import { StoreOfferCard } from "./store-offer-card";

export type StoreBooksCardItem = {
  name: string;
  real_price: BigInt;
  strike_price: BigInt;
  currency: string;
  cover: string;
  slug: string;
};

export const StoreBooksCard: FC<{
  loading: boolean;
  list: StoreBooksCardItem[];
  category: string;
}> = ({ loading, list, category }) => {
  const renderOffers = (
    <div className="esensi-cards-offer hidden lg:flex lg:flex-col py-4 w-1/2 h-strecth [&>div]:h-stretch justify-start items-stretch">
      <StoreOfferCard
        title="Save 30%"
        subtitle="Best offer"
        description="ON SELECTED ITEMS"
        url="#"
        img="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgZLhMVEhPvF8n2qVueY_eHFBJgEkQP5OsYCXEpd8zhB52c-gNILVetxn1RccyhyG6bWRal8RcF5Qu8jEP_64N2rNz-LntTrfVA9vjHJeb1Rsa5K6jXZuVNig38iZ087Vs1_UnhtWMlV5T38fDzQE0MMX9IvCHaGT-lrySf19gq9VqFVvi4OfwbQVLkWMc/s1600/offer.png"
      />
    </div>
  );

  const retreiveBooks = list.map((book, idx) => {
    if (idx === 1) {
      return (
          <BookCard data={book} key={`store_books_${idx}`} />
      );
    } else {
      return <BookCard data={book} key={`store_books_${idx}`} />;
    }
  });

  const noBooks = (
    <div className="flex flex-col justify-center items-center gap-4 w-full h-auto py-10 px-4">
      <Frown size={48} />
      <strong className="text-[#383D64] text-center text-2xl font-semibold">
        Tidak ada buku yang ditemukan
      </strong>
      <div className="text-[#383D64] text-center text-sm font-normal">
        Coba cari kategori yang lain
      </div>
    </div>
  );
  const renderBooks = list.length > 0 ? retreiveBooks : noBooks;

  const button_link = category === "" ? "/browse" : `/category/${category}`;
  const button =
    loading || list.length == 0 ? (
      <></>
    ) : (
      <div className="flex justify-center items-center w-full px-2">
        <Button asChild className="w-full bg-[#3b2c93] text-white">
          <Link href={button_link}>
            See all e-books <ArrowRight />
          </Link>
        </Button>
      </div>
    );

  const renderBooksLoading = Array.from({ length: 8 }, (_, idx) => {
    return <BookCardLoading key={`store_books_loading_${idx}`} />;
  });

  return (
    <div className="flex flex-col justify-center items-start gap-5 px-4 w-full">
      <div className="flex flex-row justify-start items-stretch flex-wrap gap-y-4 w-full [&>a,&>.esensi-book-loading]:w-1/2 [&>a,&>.esensi-book-loading]:md:w-1/6">
        {loading ? renderBooksLoading : renderBooks}
      </div>
      <div className="flex justify-center items-center w-full lg:hidden">
        {button}
      </div>
    </div>
  );
};
export default StoreBooksCard;
