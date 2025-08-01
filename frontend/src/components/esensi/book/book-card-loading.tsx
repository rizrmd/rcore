export const BookCardLoading = () => {
  return (
    <div className="esensi-book-loading flex flex-col justify-start items-center gap-3 py-4 px-2 lg:px-4 relative cursor-pointer box-border w-full animate-pulse duration-900">
      <div className="relative w-full h-auto aspect-3/4 bg-gray-200 overflow-hidden"></div>
      <div className="flex flex-col gap-2 w-full h-auto text-[15px] text-center text-[#383D64] font-semibold leading-[1.3] px-6 [&>div]:w-full [&>div]:h-4 [&>div]:bg-gray-200 [&>div]:rounded-full">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div className="flex flex-row justify-end items-center w-full gap-3 px-4 text-nowrap">
        <div className="w-auto font-bold"></div>
      </div>
    </div>
  );
};
export default BookCardLoading;
