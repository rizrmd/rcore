import type CSS from "csstype";

interface BannerHeaderProps {
  title: string;
  bannerImg: string | null;
}

export const BannerHeader = ({ title, bannerImg }: BannerHeaderProps) => {
  const bannerCSS: CSS.Properties = {
    backgroundImage: bannerImg !== null ? `url(/${bannerImg})` : `none`,
  };

  return (
    <div
      className="flex justify-center w-full h-auto p-6 bg-cover bg-center bg-no-repeat text-white text-lg font-semibold lg:text-3xl lg:h-40 lg:items-center"
      style={bannerCSS}
    >
      <h2 className="w-full max-w-[1200px]">{title}</h2>
    </div>
  );
};

export default BannerHeader;