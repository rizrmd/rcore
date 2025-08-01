import { baseUrl } from "@/lib/gen/base-url";
import { navigate } from "@/lib/router";

export default () => {
  navigate("/login?callbackURL=" + encodeURIComponent(baseUrl.main_esensi));
  return <></>;
};
