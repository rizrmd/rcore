import { APIError, betterAuth } from "better-auth";
import { openAPI, twoFactor, username } from "better-auth/plugins";
import type { User as AuthUser } from "better-auth/types";
import { randomUUIDv7 } from "bun";
import { Pool } from "pg";
import { dir, type SiteConfig } from "rlib/server";
import type {
  affiliate,
  author,
  customer,
  internal,
  publisher,
} from "shared/models";
import { translateErrorMessage } from "shared/utils/translate";
import { sendEmail } from "./email-system";
import raw_config from "../../../config.json";

const config = raw_config as SiteConfig;

// Check for BETTER_AUTH_URL and remove it from .env if found
if (process.env.BETTER_AUTH_URL) {
  console.error(
    "\x1b[31m❌ ERROR: BETTER_AUTH_URL environment variable is set.\x1b[0m\n" +
    "\x1b[31mThis variable must be removed to allow dynamic OAuth redirect detection.\x1b[0m\n" +
    "\x1b[31mPlease remove BETTER_AUTH_URL from your .env file and restart the application.\x1b[0m\n"
  );
  
  // Try to remove it from .env files
  const envFiles = ['.env', 'shared/.env'];
  let removedFrom: string[] = [];
  
  for (const envFile of envFiles) {
    try {
      const envPath = dir.path(envFile);
      const envContent = await Bun.file(envPath).text();
      
      // Check if the file contains BETTER_AUTH_URL
      if (envContent.includes('BETTER_AUTH_URL')) {
        // Remove lines containing BETTER_AUTH_URL
        const lines = envContent.split('\n');
        const filteredLines = lines.filter(line => !line.trim().startsWith('BETTER_AUTH_URL'));
        const newContent = filteredLines.join('\n');
        
        // Write back to file
        await Bun.write(envPath, newContent);
        removedFrom.push(envFile);
      }
    } catch (e) {
      // File might not exist, ignore
    }
  }
  
  if (removedFrom.length > 0) {
    console.log(
      "\x1b[32m✓ BETTER_AUTH_URL has been removed from: " + removedFrom.join(', ') + "\x1b[0m\n" +
      "\x1b[33m⚠️  Please restart the application for changes to take effect.\x1b[0m"
    );
  }
  
  // Exit the process
  process.exit(1);
}

const templates = {
  emailVerification: await Bun.file(
    dir.path("backend/src/lib/template/email-verification.html")
  ).text(),
  resetPassword: await Bun.file(
    dir.path("backend/src/lib/template/reset-password.html")
  ).text(),
  otpCodeRequest: await Bun.file(
    dir.path("backend/src/lib/template/otp-code-request.html")
  ).text(),
  changeEmailVerification: await Bun.file(
    dir.path("backend/src/lib/template/change-email-verification.html")
  ).text(),
  beforeAccountDeletion: await Bun.file(
    dir.path("backend/src/lib/template/before-account-deletion.html")
  ).text(),
  afterAccountDeletion: await Bun.file(
    dir.path("backend/src/lib/template/after-account-deletion.html")
  ).text(),
};

const aStyle = `display: inline-block; padding: 10px 20px; background-color: #222831; color: white; text-decoration: none; border-radius: 5px; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-align: center; text-decoration: none;`;

// Legacy sendEmail function removed - now using email-system

export const auth = betterAuth({
  hooks: {
    async after(ctx) {
      const error = (ctx as any).context?.returned as APIError;

      if (error) {
        error.message = translateErrorMessage(error.message);
        // error.body is a readonly property, it can't be set
        // error.body = {
        //   ...error.body,
        //   message: error.message
        // }
      }

      return ctx;
    },
  },
  advanced: {
    database: {
      generateId: () => randomUUIDv7(),
    },
  },
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset Password Esensi Online",
        text: `
Esensi Online
Reset Password
Silakan klik link berikut untuk mengatur ulang password Anda
${url}
`,
        html: templates.resetPassword
          .replaceAll("[[url]]", url)
          .replaceAll("[[aStyle]]", aStyle),
        // Will auto-select credential based on context (default: info@esensi.online)
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verifikasi Email Esensi Online",
        text: `
Esensi Online
Verifikasi Email
Hai, ${user.email}.
Terima kasih sudah mendaftarkan diri pada Esensi Online.
Silakan klik link berikut untuk memverifikasi akun email Anda. Link ini akan kedaluwarsa setelah 24 jam.
${url}
`,
        html: templates.emailVerification
          .replaceAll("[[url]]", url)
          .replaceAll("[[aStyle]]", aStyle),
        // Will auto-select credential based on context (default: info@esensi.online)
      });
    },
    expiresIn: 3600, // 1 hour
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    // facebook: {
    //   clientId: process.env.FACEBOOK_CLIENT_ID as string,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    //   scopes: ["email", "public_profile", "user_friends"], // Overwrites permissions
    //   fields: ["id", "name", "email", "picture", "user_friends"], // Extending list of fields
    // },
  },
  trustedOrigins(req) {
    const url = new URL(req.url);
    const forwardedHost = req.headers.get("x-forwarded-host");
    const trusted = [] as string[];

    for (const site of Object.values(config.sites)) {
      trusted.push(`http://localhost:${site.devPort}`);
      site.domains?.forEach((e) => trusted.push(`https://${e}`));
    }

    if (url.hostname === "127.0.0.1" && !!forwardedHost) {
      if (forwardedHost.endsWith(".github.dev")) {
        const parts = forwardedHost.split("-");

        for (const site of Object.values(config.sites)) {
          const lastPart = parts[parts.length - 1]!.split(".");

          lastPart[0] = site.devPort! + "";
          parts[parts.length - 1] = lastPart.join(".");

          trusted.push(`https://${parts.join("-")}`);
        }
      }
    }
    return trusted;
  },
  plugins: [
    openAPI(), // /api/auth/reference
    username(),
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }, request) {
          if (!otp) throw new Error("OTP not found");
          if (!request) throw new Error("Request not found");
          if (!request.headers) throw new Error("Request headers not found");
          const host = request.headers.get("host");
          if (!host) throw new Error("Host not found");
          const url = `https://${host}/auth/verify-otp?otp=${otp}`;
          await sendEmail({
            to: user.email,
            subject: "Kode OTP Esensi Online",
            text: `
Esensi Online
Kode OTP
Kode OTP Anda: ${otp}
Silakan masukkan kode OTP untuk verifikasi
${url}
`,
            html: templates.otpCodeRequest
              .replaceAll("[[otp]]", otp)
              .replaceAll("[[url]]", url)
              .replaceAll("[[aStyle]]", aStyle),
          });
        },
      },
    }),
  ],
  session: {
    modelName: "auth_session",
    fields: {
      userId: "id_user",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "auth_verification",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  account: {
    accountLinking: {
      trustedProviders: ["email-password", "google", "facebook"],
    },
    modelName: "auth_account",
    fields: {
      accountId: "id_account",
      userId: "id_user",
      providerId: "id_provider",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      idToken: "id_token",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  user: {
    modelName: "auth_user",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      idCustomer: {
        type: "string",
        required: false,
        fieldName: "id_customer",
        references: {
          model: "customer",
          field: "id",
        },
      },
      idAuthor: {
        type: "string",
        required: false,
        fieldName: "id_author",
        references: {
          model: "author",
          field: "id",
        },
      },
      idAffiliate: {
        type: "string",
        required: false,
        fieldName: "id_affiliate",
        references: {
          model: "affiliate",
          field: "id",
        },
      },
      idInternal: {
        type: "string",
        required: false,
        fieldName: "id_internal",
        references: {
          model: "internal",
          field: "id",
        },
      },
      idPublisher: {
        type: "string",
        required: false,
        fieldName: "id_publisher",
        references: {
          model: "publisher",
          field: "id",
        },
      },
    },
    changeEmail: {
      enabled: true,
      async sendChangeEmailVerification(data, request) {
        await sendEmail({
          to: data.user.email,
          subject: "Verifikasi Perubahan Email Esensi Online",
          text: `
Esensi Online
Verifikasi Perubahan Email
Ada permintaan perubahan email Anda menjadi ${data.newEmail}.
Silakan klik link berikut untuk memverifikasi perubahan email Anda
${data.url}
`,
          html: templates.changeEmailVerification
            .replaceAll("[[newUrl]]", data.newEmail)
            .replaceAll("[[url]]", data.url)
            .replaceAll("[[aStyle]]", aStyle),
        });
      },
    },
    deleteUser: {
      async beforeDelete(user, request) {
        await sendEmail({
          to: user.email,
          subject: "Permintaan Hapus Akun Esensi Online",
          text: `
Esensi Online
Permintaan Hapus Akun
Ada permintaan untuk menghapus akun Anda.
Jika Anda tidak melakukan permintaan ini, silakan segera hubungi tim dukungan kami.
`,
          html: templates.beforeAccountDeletion,
        });
      },
      async afterDelete(user, request) {
        await sendEmail({
          to: user.email,
          subject: "Account Deletion",
          text: `Your account has been deleted.`,
          html: `<div>Your account has been deleted.</div>`,
        });
      },
    },
  },
});

export const utils = {
  mapping: {
    column: {
      session: ({
        id,
        userId,
        expiresAt,
        ipAddress,
        userAgent,
        createdAt,
        updatedAt,
        token,
      }: {
        id: string;
        userId: string;
        expiresAt: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
        createdAt: Date;
        updatedAt: Date;
        token: string;
      }) => ({
        id,
        id_user: userId,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: createdAt,
        updated_at: updatedAt,
        token,
      }),
      verification: ({
        id,
        identifier,
        value,
        expiresAt,
        createdAt,
        updatedAt,
      }: {
        id: string;
        identifier: string;
        value: string;
        expiresAt: string;
        createdAt: string;
        updatedAt?: Date | null;
      }) => ({
        id,
        identifier,
        value,
        expires_at: expiresAt,
        created_at: createdAt,
        updated_at: updatedAt,
      }),
      account: ({
        id,
        userId,
        accountId,
        providerId,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        idToken,
        createdAt,
        updatedAt,
        role,
        password,
        scope,
      }: {
        id: string;
        userId: string;
        accountId: string;
        providerId: string;
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: string;
        refreshTokenExpiresAt: string;
        idToken: string;
        createdAt: string;
        updatedAt: string;
        role: string;
        password?: string | null;
        scope?: string | null;
      }) => ({
        id_user: userId,
        id_account: accountId,
        id_provider: providerId,
        access_token: accessToken,
        refresh_token: refreshToken,
        access_token_expires_at: accessTokenExpiresAt,
        refresh_token_expires_at: refreshTokenExpiresAt,
        id_token: idToken,
        created_at: createdAt,
        updated_at: updatedAt,
        role,
        password,
        scope,
      }),
      user: ({
        id,
        name,
        email,
        emailVerified,
        createdAt,
        updatedAt,
        image,
        twoFactorEnabled,
        id_customer,
        id_author,
        id_affiliate,
        id_internal,
        id_publisher,
      }: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        image?: string | null;
        twoFactorEnabled?: boolean | null;
        id_customer?: string | null;
        id_author?: string | null;
        id_affiliate?: string | null;
        id_internal?: string | null;
        id_publisher?: string | null;
      }) => ({
        id,
        name,
        email,
        email_verified: emailVerified,
        created_at: createdAt,
        updated_at: updatedAt,
        image,
        two_factor_enabled: twoFactorEnabled,
        id_customer,
        id_author,
        id_affiliate,
        id_internal,
        id_publisher,
      }),
    },
  },
  signInEmail: async ({
    email,
    password,
    rememberMe = false,
    callbackURL = "/dashboard",
  }: {
    email: string;
    password: string;
    rememberMe?: boolean;
    callbackURL?: string;
  }): Promise<Response> => {
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe,
        callbackURL,
      },
      asResponse: true,
    });
    return response;
  },
  getSession: async (headers: Headers) => {
    // First get the session token from the cookie
    let sessionToken: string | null = null;
    const cookieHeader = headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map((c: string) => c.trim());
      const authSessionCookie = cookies.find((c: string) => 
        c.startsWith('__Secure-better-auth.session_token=') || 
        c.startsWith('better-auth.session_token=')
      );
      if (authSessionCookie) {
        sessionToken = authSessionCookie.split('=')[1];
      }
    }
    
    const response = await auth.api.getSession({
      headers,
    });
    
    // Enhance the user data with related entities
    if (response?.user?.id) {
      const userWithRelations = await db.auth_user.findFirst({
        where: { id: response.user.id },
        include: {
          auth_account: true,
          affiliate: true,
          author: true,
          customer: { include: { customer_address: true } },
          publisher: true,
          internal: true,
        },
      });

      if (userWithRelations) {
        // Transform null strings to actual null values
        if (userWithRelations.id_affiliate === "null") userWithRelations.id_affiliate = null;
        if (userWithRelations.id_author === "null") userWithRelations.id_author = null;
        if (userWithRelations.id_customer === "null") userWithRelations.id_customer = null;
        if (userWithRelations.id_internal === "null") userWithRelations.id_internal = null;
        if (userWithRelations.id_publisher === "null") userWithRelations.id_publisher = null;

        // Enhance the user object
        // Type assertion to handle the User type
        (response as any).user = {
          ...response.user,
          username: userWithRelations.username,
          displayUsername: userWithRelations.username,
          idCustomer: userWithRelations.id_customer,
          idAuthor: userWithRelations.id_author,
          idAffiliate: userWithRelations.id_affiliate,
          idInternal: userWithRelations.id_internal,
          idPublisher: userWithRelations.id_publisher,
          twoFactorEnabled: userWithRelations.two_factor_enabled,
          customer: userWithRelations.customer,
          author: userWithRelations.author,
          affiliate: userWithRelations.affiliate,
          internal: userWithRelations.internal,
          publisher: userWithRelations.publisher,
        };
      }
    }
    
    // Add session token to response
    if (sessionToken && response) {
      (response as any).sessionToken = sessionToken;
    }
    
    return response;
  },
};

export type User = Partial<AuthUser> &
  Partial<{
    username: string | null;
    displayUsername: string | null;
    idCustomer: string | null;
    idAuthor: string | null;
    idAffiliate: string | null;
    idInternal: string | null;
    idPublisher: string | null;
    twoFactorEnabled: boolean | null;
    customer: customer | null;
    author: author | null;
    affiliate: affiliate | null;
    internal: internal | null;
    publisher: publisher | null;
  }>;
