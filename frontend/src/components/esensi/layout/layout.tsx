import { betterAuth } from "@/lib/better-auth";
import { api as authApi } from "@/lib/gen/auth.esensi";
import { baseUrl } from "@/lib/gen/base-url";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import type { FC, ReactNode } from "react";
import type { User } from "shared/types";
import { Protected } from "../../app/protected";
import { MobileNavbar } from "../navigation/mobile-navbar";
import { ProfileSlide } from "../profile/profile-slide";
import { TrackingScripts } from "../ui/tracking-scripts";
import { PageFooter } from "./page-footer";
import { PageHeader } from "./page-header";

type MainEsensiLayoutProps = {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showSearch?: boolean;
  header_config?: any;
  mobile_menu?: boolean;
  footer_config?: any;
  profile?: any;
};

export const current = {
  user: undefined as User | undefined,
};

export const MainEsensiLayout: FC<MainEsensiLayoutProps> = ({
  children,
  header_config = {
    enable: true,
    logo: true,
    back: true,
    search: true,
    searchQuery: "",
    title: null,
    cart: true,
    profile: true,
    mobileHide: false,
    desktopHide: false,
  },
  mobile_menu = true,
  footer_config = {
    desktopHide: false,
  },
}) => {
  const local = useLocal(
    {
      searchQuery: "",
      profileOpen: false as boolean,
    },
    async () => {
      const res = await betterAuth.getSession();
      if (res) {
        current.user = res.data?.user;
        // if the user is logged in, we need to check if they have a customer record
        if (current.user) {
          const idCustomer = current.user.idCustomer || null;
          // create a new customer record if it doesn't exist and bind it to the logged-in user
          if (!idCustomer) {
            await api
              .customer_create({
                name: current.user.name || "Pengguna",
                email: current.user.email,
                whatsapp: "-",
              })
              .then(async (res) => {
                if (res) {
                  const customer = res.data;
                  const res2 = await authApi.user_update({
                    id: current.user!.id,
                    data: {
                      ...current.user!,
                      idCustomer: customer?.id,
                    },
                  });
                }
              });
          }
        }
      }

      // Force a re-render when current user changes
      local.render();
    }
  );

  const toggleProfile = () => {
    local.profileOpen = !local.profileOpen;
    local.render();
  };

  // Helper function to construct proper avatar URL
  const getAvatarUrl = (imageFilename: string | null | undefined) => {
    if (!imageFilename) return null;

    // If it's already a full URL, return as is
    if (imageFilename.startsWith("http")) return imageFilename;

    // If it starts with slash, it's a relative path from auth_esensi domain
    if (imageFilename.startsWith("/"))
      return `${baseUrl.auth_esensi}${imageFilename}`;

    // Otherwise, it's a filename that needs to be served through the files endpoint
    return `${baseUrl.auth_esensi}/${imageFilename}`;
  };

  // Helper function to generate loyalty data
  const getLoyaltyData = () => {
    if (!current.user?.customer) return null;

    // Generate loyalty ID from user info or use existing customer data
    const loyaltyId = current.user.customer.id
      ? current.user.customer.id.slice(-8).toUpperCase()
      : "GUEST";

    // For now, return mock points data - in real app, this would come from the customer record
    return {
      id: loyaltyId,
      points: 0, // This should come from the actual customer loyalty data
    };
  };

  // Prepare user profile data from the logged-in user
  const userProfile = current.user
    ? {
        user: {
          avatar: getAvatarUrl(current.user.image),
          fullname: current.user.name || "Pengguna",
          email: current.user.email || null,
        },
        loyality: getLoyaltyData() || {
          id: null,
          points: 0,
        },
      }
    : null; // Pass null to show guest login state
  return (
    <Protected role={"any"} allowGuest>
      <TrackingScripts />
      <div className="flex h-auto flex-col gap-0 pb-25 lg:pb-0 m-0 text-[color:#020817]">
        <PageHeader
          enable={header_config.enable}
          title={header_config.title}
          back={header_config.back}
          logo={header_config.logo}
          search={header_config.search}
          searchQuery={header_config.searchQuery}
          cart={header_config.cart}
          profile={header_config.profile}
          mobileHide={header_config.mobileHide}
          desktopHide={header_config.desktopHide}
          toggleProfile={toggleProfile}
          user={current.user}
        />
        <div className="grow-1 h-auto">{children}</div>
        <PageFooter desktopHide={footer_config.desktopHide} />
        <MobileNavbar enable={mobile_menu} />
        <ProfileSlide
          open={local.profileOpen}
          profile={userProfile}
          loading={false}
          action={toggleProfile}
        />
      </div>
    </Protected>
  );
};
export default MainEsensiLayout;
