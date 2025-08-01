import { AppLoading } from "@/components/app/loading";
import { Protected } from "@/components/app/protected";
import { betterAuth } from "@/lib/better-auth";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import type { FC, ReactNode } from "react";
import type { User } from "shared/types";
import { Role } from "shared/types";
import { MenuBarInternal } from "../menu-bar/internal";

export const current = {
  user: undefined as User | undefined,
};

export const Layout: FC<{
  loading?: boolean;
  children?: ReactNode;
}> = ({ loading, children }) => {
  const roles = [Role.INTERNAL];

  useLocal({}, async () => {
    const res = await betterAuth.getSession();
    current.user = res.data?.user;
    if (!current.user) navigate("/index");
    if (!current.user?.idInternal) return;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <MenuBarInternal />
        <div className="flex-1 flex items-center justify-center">
          <AppLoading />
        </div>
      </div>
    );
  }

  return (
    <Protected role={roles} >
      <div className="flex min-h-screen flex-col bg-gray-50">{children}</div>
    </Protected>
  );
};
