import { defineAPI } from "rlib/server";

interface BannerResponse {
  data: {
    img: any;
    multiple: boolean;
  };
}

export default defineAPI({
  name: "banner",
  url: "/api/main/banner",
  async handler(arg: { for: string | null }): Promise<BannerResponse> {
    const banner_for = arg?.for ? arg.for : "default";

    const getBanner = await db.banner.findFirst({
      select: {
        banner_file: true,
      },
      where: {
        title: `banner-${banner_for}`,
        deleted_at: null,
      },
    });

    const the_files =
      getBanner !== null ? JSON.parse(getBanner.banner_file as string) : [];
    const multiple_files = the_files.length > 1 ? true : false;
    const banner_file = multiple_files ? the_files : the_files[0];

    const data = {
      img: banner_file,
      multiple: multiple_files,
    };

    return {
      data: data,
    };
  },
});
