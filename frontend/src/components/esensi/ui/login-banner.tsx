import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import type CSS from "csstype";
import { ImgThumb } from "./img-thumb";
export const LoginBanner = ({
  img = null as string | null,
  title = null as string | null,
  subtitle = null as string | null,
}) => {
  const local = useLocal(
    {
      banner: `` as string,
    },
    async () => {
      const getBanner = await api.banner({ for: "login" });
      if (getBanner?.data) {
        local.banner = getBanner.data?.img;
      }
      local.render();
    }
  );

  const esensi_logo_url = `/img/esensi-online-logo-white.png`;
  const esensi_logo = (
    <ImgThumb
      src={esensi_logo_url}
      alt="Esensi Online"
      className="w-[120px] h-auto object-contain"
      skipResize={true}
    />
  );

  const bannerCSS: CSS.Properties = {
    backgroundImage: `url(/${local.banner})`,
  };
  if (title == null || title == "") {
    title = `Dunia Baru Dimulai dari Satu Halaman`;
  }
  if (subtitle == null || subtitle == "") {
    subtitle = `Selamat datang di Esensi Online, platform buku digital yang menghubungkan pembaca dengan pengetahuan dan cerita dari seluruh dunia.`;
  }

  return (
    <div
      className="flex w-full h-full p-20 gap-10 flex-col justify-between items-start bg-cover bg-no-repeat bg-top-left"
      style={bannerCSS}
    >
      <div className="flex grow-1 justify-start items-start">{esensi_logo}</div>
      <h2 className="flex text-7xl text-white font-semibold">{title}</h2>
      <p className="flex text-white">{subtitle}</p>
    </div>
  );
};

export default LoginBanner;
