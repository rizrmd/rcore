import { current } from "@/components/app/protected";
import { baseUrl } from "@/lib/gen/base-url";
import type { User } from "shared/types";
import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins";
import type { Session } from "better-auth/types";
import { twoFactor } from "better-auth/plugins";

type FetchOptions = {
  onRequest?: (ctx: any) => void;
  onSuccess?: (ctx: any) => void;
  onError?: (ctx: any) => void;
  onRetry?: (ctx: any) => void;
};

type Provider =
  | "apple"
  | "discord"
  | "facebook"
  | "github"
  | "google"
  | "microsoft"
  | "spotify"
  | "twitch"
  | "twitter"
  | "dropbox"
  | "linkedin"
  | "gitlab"
  | "tiktok"
  | "reddit"
  | "roblox"
  | "vk"
  | "kick"
  | "zoom";

type error = {
  code?: string | undefined;
  message?: string | undefined;
  status: number;
  statusText: string;
} | null;

export type AuthClientGetSessionAPIResponse = {
  data: { user: User; session: Session } | null;
  error: error;
};

let hostname = location.host;


const authClient = createAuthClient({
  baseURL: `${location.protocol}//${hostname}`,
  plugins: [
    // twoFactor()
  ],
});
console.log(`${location.protocol}//${hostname}`, authClient)

export const betterAuth = {
  signUp: async ({
    username,
    password,
    name,
    callbackURL = "/dashboard",
    image,
    fetchOptions,
  }: {
    username: string;
    password: string;
    name: string;
    callbackURL?: string;
    image?: string;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    const { data, error } = await authClient.signUp.email({
      email: username,
      password,
      name,
      callbackURL,
      image,
      fetchOptions,
    });
    return { data, error };
  },
  signIn: async ({
    username,
    password,
    callbackURL = "/dashboard",
    rememberMe,
    fetchOptions,
  }: {
    username: string;
    password: string;
    callbackURL?: string;
    rememberMe?: boolean;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    const { data, error } = await authClient.signIn.email(
      {
        email: username,
        password,
        callbackURL,
        rememberMe,
      },
      fetchOptions
    );
    return { data, error };
  },
  social: async ({
    provider,
    callbackURL = baseUrl.main,
    errorCallbackURL = "/error",
    newUserCallbackURL = baseUrl.main,
    disableRedirect = false,
    idToken,
    loginHint,
    requestSignUp,
    scopes,
    fetchOptions,
  }: {
    provider: Provider;
    callbackURL?: string;
    errorCallbackURL?: string;
    newUserCallbackURL?: string;
    disableRedirect?: boolean;
    idToken?: {
      token: string;
      refreshToken?: string | undefined;
      accessToken?: string | undefined;
      expiresAt?: number | undefined;
      nonce?: string | undefined;
    };
    loginHint?: string;
    requestSignUp?: boolean;
    scopes?: string[];
    fetchOptions?: FetchOptions | undefined;
  }) => {
    const { data, error } = await authClient.signIn.social({
      provider,
      callbackURL,
      errorCallbackURL,
      newUserCallbackURL,
      disableRedirect,
      idToken,
      loginHint,
      requestSignUp,
      scopes,
      fetchOptions,
    });
    return { data, error };
  },
  signOut: () => {
    return new Promise<void>((resolve, reject) => {
      if (current.iframe && current.iframe.contentWindow) {
        // Set up timeout in case iframe doesn't respond
        const timeout = setTimeout(() => {
          current.signoutCallback = undefined;
          reject(new Error('Signout timeout - iframe did not respond'));
        }, 8000);

        current.signoutCallback = async () => {
          clearTimeout(timeout);
          
          // Clear cookie from current domain as well
          try {
            await fetch('/api/sync-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'clear' }),
            });
          } catch (error) {
            console.error('Failed to clear session from current domain:', error);
          }
          
          resolve();
        };

        // Clear session data immediately
        current.user = null;
        current.session = null;
        
        try {
          current.iframe.contentWindow.postMessage("signout", "*");
        } catch (error) {
          clearTimeout(timeout);
          current.signoutCallback = undefined;
          reject(error);
        }
      } else {
        // If no iframe, clear session data and resolve immediately
        current.user = null;
        current.session = null;
        current.loaded = false;
        resolve();
      }
    });
  },
  useSession: () => {
    return authClient.useSession;
  },
  getSession: async (): Promise<AuthClientGetSessionAPIResponse> => {
    const isAuthDomain = false;

    if (!isAuthDomain) {
      if (!current.loaded && !current.promise) {
        current.promise = current.reload();
      }

      if (current.promise) {
        await current.promise;
      }
      current.loaded = true;
      current.promise = null;

      const data = isAuthDomain
        ? (await authClient.getSession()).data
        : { user: current.user!, session: current.session! };

      current.loaded = true;
      if (data?.user) {
        const user = data.user as User;
        current.user = user;

        // Null string conversion already handled on backend
        current.session = data.session;
      }
    }
    return {
      data: { user: current.user!, session: current.session! },
      error: null as any,
    };
  },
  // twoFactor: {
  //   enable: async ({
  //     password,
  //     issuer,
  //     fetchOptions,
  //   }: {
  //     password: string;
  //     issuer?: string | undefined;
  //     fetchOptions?: FetchOptions | undefined;
  //   }) => {
  //     const { data, error } = await authClient.twoFactor.enable({
  //       password,
  //       issuer,
  //       fetchOptions,
  //     });
  //     return { data, error };
  //   },
  //   disable: async ({
  //     password,
  //     fetchOptions,
  //   }: {
  //     password: string;
  //     fetchOptions?: FetchOptions | undefined;
  //   }) => {
  //     const { data, error } = await authClient.twoFactor.disable({
  //       password,
  //       fetchOptions,
  //     });
  //     return { data, error };
  //   },
  //   getTotpUri: async ({
  //     password,
  //     fetchOptions,
  //   }: {
  //     password: string;
  //     fetchOptions: FetchOptions | undefined;
  //   }) => {
  //     const { data, error } = await authClient.twoFactor.getTotpUri({
  //       password,
  //       fetchOptions,
  //     });
  //     return { data, error };
  //   },
  //   verifyTotp: async ({
  //     code,
  //     trustDevice = false,
  //     fetchOptions,
  //   }: {
  //     code: string;
  //     trustDevice?: boolean | undefined;
  //     fetchOptions?: FetchOptions | undefined;
  //   }) => {
  //     const { data, error } = await authClient.twoFactor.verifyTotp({
  //       code,
  //       trustDevice,
  //       fetchOptions,
  //     });
  //     return { data, error };
  //   },
  //   sendOtp: async ({
  //     query,
  //     fetchOptions,
  //   }: {
  //     query?: Record<string, any> | undefined;
  //     fetchOptions?: FetchOptions | undefined;
  //   }) => {
  //     const { data, error } = await authClient.twoFactor.sendOtp({
  //       query,
  //       fetchOptions,
  //     });
  //     return { data, error };
  //   },
  //   verifyOtp: async ({
  //     code,
  //     trustDevice = false,
  //     fetchOptions,
  //   }: {
  //     code: string;
  //     trustDevice?: boolean | undefined;
  //     fetchOptions?: FetchOptions | undefined;
  //   }) => {
  //     const { data, error } = await authClient.twoFactor.verifyOtp({
  //       code,
  //       trustDevice,
  //       fetchOptions,
  //     });
  //     return { data, error };
  //   },
  // },
  sendVerificationEmail: async ({
    email,
    callbackURL,
    fetchOptions,
  }: {
    email: string;
    callbackURL?: string | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.sendVerificationEmail({
      email,
      callbackURL,
      fetchOptions,
    });
  },
  verifyEmail: async ({
    query,
    fetchOptions,
  }: {
    query: { token: string; callbackURL?: string | undefined };
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.verifyEmail({
      query,
      fetchOptions,
    });
  },
  forgetPassword: async ({
    email,
    redirectTo,
    fetchOptions,
  }: {
    email: string;
    redirectTo?: string | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.forgetPassword({
      email,
      redirectTo,
      fetchOptions,
    });
  },
  resetPassword: async ({
    newPassword,
    token,
    fetchOptions,
  }: {
    newPassword: string;
    token?: string | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.resetPassword({
      newPassword,
      token,
      fetchOptions,
    });
  },
  changeEmail: async ({
    newEmail,
    callbackURL,
    fetchOptions,
  }: {
    newEmail: string;
    callbackURL?: string | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.changeEmail({
      newEmail,
      callbackURL,
      fetchOptions,
    });
  },
  changePassword: async ({
    newPassword,
    currentPassword,
    revokeOtherSessions,
    fetchOptions,
  }: {
    newPassword: string;
    currentPassword: string;
    revokeOtherSessions?: boolean | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.changePassword({
      newPassword,
      currentPassword,
      revokeOtherSessions,
      fetchOptions,
    });
  },
  updateUser: async ({
    name,
    image,
    fetchOptions,
  }: {
    name?: string | undefined;
    image?: string | null | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.updateUser({
      name,
      image,
      fetchOptions,
    });
  },
  deleteUser: async ({
    password,
    token,
    callbackURL,
    fetchOptions,
  }: {
    password?: string | undefined;
    token?: string | undefined;
    callbackURL?: string | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.deleteUser({
      password,
      token,
      callbackURL,
      fetchOptions,
    });
  },
  listSessions: async ({
    query,
    fetchOptions,
  }: {
    query?: Record<string, any> | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.listSessions({
      query,
      fetchOptions,
    });
  },
  revokeSession: async ({
    token,
    fetchOptions,
  }: {
    token: string;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.revokeSession({
      token,
      fetchOptions,
    });
  },
  revokeSessions: async ({
    query,
    fetchOptions,
  }: {
    query?: Record<string, any> | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.revokeSessions({
      query,
      fetchOptions,
    });
  },
  revokeOtherSessions: async ({
    query,
    fetchOptions,
  }: {
    query?: Record<string, any> | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.revokeSessions({
      query,
      fetchOptions,
    });
  },
  linkSocial: async ({
    provider,
    scopes,
    fetchOptions,
  }: {
    provider: Provider;
    scopes?: string[] | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.linkSocial({
      provider,
      scopes,
      fetchOptions,
    });
  },
  unlinkAccount: async ({
    providerId,
    accountId,
    fetchOptions,
  }: {
    providerId: string;
    accountId?: string | undefined;
    fetchOptions?: FetchOptions | undefined;
  }) => {
    return await authClient.unlinkAccount({
      providerId,
      accountId,
      fetchOptions,
    });
  },
};
