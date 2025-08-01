import { baseUrl } from "@/lib/gen/base-url";
import { useLocal } from "@/lib/hooks/use-local";
// import { notif } from "@/lib/notif";
import { navigate } from "@/lib/router";
import { snakeToCamel } from "@/lib/utils";
import type { Session } from "better-auth/types";
import { type FC, type ReactNode } from "react";
import type { User } from "shared/types";
import { Alert } from "../ui/global-alert";
import { AppLoading } from "./loading";

export const current = {
  user: null as User | null,
  session: null as Session | null,
  iframe: null as HTMLIFrameElement | null,
  signoutCallback: undefined as undefined | (() => void),
  loaded: false,
  missing_role: [] as string[],
  promise: null as null | Promise<void>,
  done: () => {},
  syncing: false, // Add flag to prevent duplicate sync calls

  reload() {
    return new Promise<void>((done) => {
      current.iframe = document.getElementById(
        "session-frame"
      ) as HTMLIFrameElement | null;
      if (!current.iframe) {
        current.iframe = document.createElement("iframe");
        current.iframe.id = "session-frame";
        current.iframe.src = baseUrl.main + "/api/get-session-frame";
        current.iframe.style.display = "none";
        document.body.appendChild(current.iframe);
      }

      const messageHandler = async (e: MessageEvent) => {
        if (e.data?.action == "signout") {
          if (current.signoutCallback) current.signoutCallback();
          current.signoutCallback = undefined;
        }
        if (e.data?.action == "session") {
          // Sync the session cookie to current domain (only if not already syncing)
          if (e.data.sessionCookie && !current.syncing) {
            current.syncing = true;
            try {
              await fetch('/api/sync-session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionToken: e.data.sessionCookie }),
              });
            } catch (error) {
              console.error('Failed to sync session cookie:', error);
            } finally {
              current.syncing = false;
            }
          }
          
          current.promise = null;
          current.loaded = true;
          current.user = e.data.user;
          current.session = e.data.session;
          done();
          this.done();
        }
      };

      window.addEventListener("message", messageHandler);
    });
  },
};

export const Protected: FC<{
  children:
    | ReactNode
    | ((opt: { user: User | null; missing_role: string[] }) => ReactNode);
  role?: string | string[] | "any";
  onLoad?: (opt: { user: null | User }) => void | Promise<void>;
  fallbackUrl?: string | null;
  allowGuest?: boolean;
  pages?: string[] | null;
}> = ({ children, role, onLoad, fallbackUrl, allowGuest, pages }) => {
  const params = new URLSearchParams(location.search);
  let callbackURL = params.get("callbackURL") as string | undefined;
  callbackURL = !callbackURL ? window.location.origin : callbackURL;

  const local = useLocal({}, async () => {
    if (!current.loaded) {
      await current.reload();

      if (!allowGuest && !current.user) {
        console.log('redirect to /')
      } else {
        if (current.user?.id) {
          // notif.init(current.user.id);
          // Clean up user data if needed
        }

        if (role !== "any") {
          const roles = Array.isArray(role) ? role : [role];
          current.missing_role = [];
          for (const r of roles) {
            if (
              current.user &&
              current.user.role !== r
            ) {
              if (r) current.missing_role.push(r);
            }
          }
          if (roles.length > 0 && current.missing_role.length < roles.length)
            current.missing_role = [];
        }

        if (!allowGuest && !current.user) Alert.info("Error loading session");
        if (onLoad) {
          if (!current.loaded) current.loaded = true;
          onLoad({ user: current.user });
        }
      }
      local.render();
    }
  });
  current.done = local.render;

  if (current.promise) return <AppLoading />;

  if (!!fallbackUrl && !current.user) navigate(fallbackUrl);
  if (current.missing_role.length > 0) {
    if (fallbackUrl) {
      navigate(fallbackUrl);
      return;
    }

    return <div>Access Denied</div>;
  }

  return (
    <>
      {typeof children === "function"
        ? children({ user: current.user, missing_role: current.missing_role })
        : children}
    </>
  );
};
