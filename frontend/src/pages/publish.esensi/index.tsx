import { Protected } from "@/components/app/protected";
import { GlobalLoading } from "@/components/esensi/ui/global-loading";
import { SideForm } from "@/components/ext/side-form";
import { Button } from "@/components/ui/button";
import { baseUrl } from "@/lib/gen/base-url";
import { useLocal } from "@/lib/hooks/use-local";
import { Role } from "shared/types";

export default () => {
  const local = useLocal({ loading: true });
  const content = (
    <SideForm sideImage={"/img/side-bg.jpg"}>
      <div className="space-y-6 w-full">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Publish Esensi Online</h1>
          <p className="text-muted-foreground mt-2">
            Layanan Publikasi Buku Digital Dari Penulis dan Penerbit Secara
            Online
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Button className="w-full" asChild>
              <a
                href={`${baseUrl.auth_esensi
                  }/login?callbackURL=${encodeURIComponent(
                    baseUrl.publish_esensi + "/dashboard"
                  )}`}
              >
                Login ke Esensi
              </a>
            </Button>
          </div>
        </div>
      </div>
    </SideForm>
  );

  return (
    <Protected
      role={[Role.AUTHOR, Role.PUBLISHER]}
      allowGuest
      onLoad={({ user }) => {
        if (user) {
          // window.location.href = "/dashboard"; 
        }
        else {
          local.loading = false;
          local.render();
        }
      }}
    >
      {local.loading ? <GlobalLoading /> : content}
    </Protected>
  );
};
