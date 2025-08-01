import { betterAuth } from "@/lib/better-auth";
import { baseUrl } from "@/lib/gen/base-url";
import { useLocal } from "@/lib/hooks/use-local";
import type { User } from "shared/types";
import type { FC, ReactNode } from "react";
import { LayoutFooter } from "./layout-footer";
import { LayoutHeader } from "./layout-header";
import { Protected } from "@/components/app/protected";
import TrackingScripts from "../../ui/tracking-scripts";
import { ProfileDrawer } from "../ui/profile-drawer";

type EsensiChapterLayoutProps = {
  children: ReactNode;
  enableHeader?: boolean;
  enableFooter?: boolean;
  enableProfileDrawer?: boolean;
  profile?: any;
};

export const current = {
  user: undefined as User | undefined,
};

export const EsensiChapterLayout: FC<EsensiChapterLayoutProps> = ({
  children,
  enableHeader = true,
  enableFooter = true,
  enableProfileDrawer = true,
}) => {
  const local = useLocal(
    {
      toggle_profile: false as boolean,
    },
    async () => {}
  );

  const layoutStyle = {
    "--esensi-color": "#3B2C93",
    "--esensi-color-alt": "#44B5A9",
    "--esensi-color-i": "#ffffff",
    "--esensi-container-w": "1200px",
    "--esensi-container-px": "calc(var(--spacing) * 4)",
    "--esensi-container-px__lg": "0",
  } as React.CSSProperties;

  const esensiScrollbarCSS = [
    // Webkit scrollbar styling - invisible by default, visible on hover
    "[&_.esensi-scrollbar::-webkit-scrollbar]:w-2",
    "[&_.esensi-scrollbar::-webkit-scrollbar]:h-2",
    "[&_.esensi-scrollbar::-webkit-scrollbar-track]:bg-transparent",
    "[&_.esensi-scrollbar::-webkit-scrollbar-track]:rounded-full",
    "[&_.esensi-scrollbar::-webkit-scrollbar-thumb]:bg-transparent",
    "[&_.esensi-scrollbar::-webkit-scrollbar-thumb]:rounded-full",
    "[&_.esensi-scrollbar::-webkit-scrollbar-thumb]:transition-all",
    "[&_.esensi-scrollbar::-webkit-scrollbar-thumb]:duration-300",
    "[&_.esensi-scrollbar::-webkit-scrollbar-thumb]:ease-in-out",
    "[&_.esensi-scrollbar::-webkit-scrollbar-corner]:bg-transparent",
    // Show scrollbar on hover
    "[&_.esensi-scrollbar:hover::-webkit-scrollbar-thumb]:bg-gray-300/70",
    "[&_.esensi-scrollbar::-webkit-scrollbar-thumb:hover]:bg-gray-600/90",
    // Smooth scrolling behavior
    "[&_.esensi-scrollbar]:scroll-smooth",
  ].join(" ");

  const buttonCSS =
    "[&_.esensi-button]:transition-all [&_.esensi-button]:duration-300 [&_.esensi-button]:ease-in-out [&_.esensi-button]:bg-(--esensi-color-alt) [&_.esensi-button]:text-(--esensi-color-i) [&_.esensi-button:active]:bg-(--esensi-color) lg:[&_.esensi-button:hover]:bg-(--esensi-color) lg:[&_.esensi-button:active]:bg-(--esensi-color) [&_.esensi-button]:rounded-full [&_.esensi-button]:font-semibold";

  const toggleProfile = () => {
    local.toggle_profile = !local.toggle_profile;
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

  // Prepare user profile data from the logged-in user
  const userProfile = current.user
    ? {
        user: {
          avatar: getAvatarUrl(current.user.image),
          fullname: current.user.name || "Pengguna",
          email: current.user.email || null,
        },
      }
    : null; // Pass null to show guest login state

  return (
    <Protected role={"any"} allowGuest>
      <TrackingScripts />
      <div
        className={`flex h-auto flex-col gap-0 lg:pb-0 m-0 [&_.esensi-container]:w-full [&_.esensi-container]:max-w-(--esensi-container-w) [&_.esensi-container]:px-(--esensi-container-px) lg:[&_.esensi-container]:px-(--esensi-container-px__lg) ${esensiScrollbarCSS} ${buttonCSS}`}
        style={layoutStyle}
      >
        {enableHeader && (
          <LayoutHeader toggleProfile={toggleProfile} user={userProfile} />
        )}
        <div className="flex grow-1 h-auto justify-center">{children}</div>
        {enableFooter && <LayoutFooter />}
        {enableProfileDrawer && (
          <ProfileDrawer
            user={userProfile}
            open={local.toggle_profile}
            action={toggleProfile}
          />
        )}
      </div>
    </Protected>
  );
};
