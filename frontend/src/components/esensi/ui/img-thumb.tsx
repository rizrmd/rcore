import { skip } from "shared/models/runtime/library";

export const ImgThumb = ({
  src = null as string | null,
  width = null as number | null,
  height = null as number | null,
  alt = "EO Img" as string,
  className = "" as string,
  skipResize = false as boolean,
}) => {
  const w = width !== null ? width : "auto";
  const h = height !== null ? height : "auto";
  const newAlt = alt.replace(`"`, ``).replace(`'`, ``);

  let img =
    src !== null
      ? src.startsWith(`_file/`) 
      ? skipResize ? `/${src}` : `https://esensi.online/${src}` : src
      : ``;
  img = img.startsWith(`https://esensi.online/`) && !skipResize
    ? `${img.replace("_file/", "_img/")}${w !== "auto" ? `?w=${w}` : ""}`
    : img;

  const renderImg = !!src && (
    <>
      <img
        src={img}
        alt={newAlt}
        width={w}
        height={h}
        loading="lazy"
        className={className}
      />
    </>
  );
  return <>{renderImg}</>;
};

export default ImgThumb;
