import type CSS from "csstype";

export const GlobalLoading = () => {
  const logo = `<svg viewBox="0 0 55 63" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.4035 11.7311C26.1143 12.4694 30.5888 10.1295 32.7601 6.22607L5.95181 13.5606C-1.59539 37.6816 -0.660926 51.4766 8.53534 58.6266C11.8719 61.2054 15.5219 62.4106 19.4851 62.5355C26.8619 62.7635 35.2172 59.1641 43.9077 53.6102C22.1071 62.4269 24.2124 38.0019 24.2124 38.0019C24.5807 33.3058 26.4167 26.0201 29.33 17.2849C27.7579 14.4238 24.9105 12.2848 21.4035 11.7365V11.7311Z" /><path d="M48.1519 16.0692C67.3359 -7.99208 34.0139 2.1004 34.0139 2.1004L33.838 3.4305C33.893 3.19162 33.9534 2.95817 33.9919 2.7193C33.041 8.64232 37.1251 14.207 43.1222 15.1462C38.2025 14.3753 33.5302 16.9595 31.4853 21.1833L28.9678 40.1358L48.1519 16.0746V16.0692Z" /></svg>`;

  const blocks = Array.from({ length: 3 }, (_, i) => {
    const anidelay = (i * 100).toString() as string;

    const delayCSS: CSS.Properties = {
      animationDelay: `${anidelay}ms`,
    };
    return (
      <div
        key={`esensi_loading_dots_${i}`}
        className={`w-6 h-6 bg-gray-300 rounded-sm animate-bounce`}
        style={delayCSS}
      ></div>
    );
  });
  return (
    <div className="flex w-full h-100 items-center justify-center">
      <div className="flex flex-col gap-8 justify-center items-center ">
        <div
          className="flex text-gray-400 [&_svg]:w-12 [&_svg]:h-auto animate-pulse"
          dangerouslySetInnerHTML={{ __html: logo }}
        ></div>
        <div className="flex justify-center items-center gap-3 ">{blocks}</div>
      </div>
    </div>
  );
};

export default GlobalLoading;
