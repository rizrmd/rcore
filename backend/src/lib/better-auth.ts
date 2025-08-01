import { APIError, betterAuth } from "better-auth";
import { openAPI, twoFactor, username } from "better-auth/plugins";
import type { User as AuthUser } from "better-auth/types";
import { randomUUIDv7 } from "bun";
import { Pool } from "pg";
import { dir, type SiteConfig } from "rlib/server";
import { sendEmail } from "./email-system";
import raw_config from "../../../config.json";

const config = raw_config as SiteConfig;

export const auth = betterAuth({
  hooks: {
    async after(ctx) {
      const error = (ctx as any).context?.returned as APIError;
      if (error) {
        // Handle errors if needed
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
        subject: "Reset Password",
        text: `Click the following link to reset your password: ${url}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Password</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p style="margin-top: 20px; color: #666;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Please verify your email by clicking: ${url}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Hi ${user.email},</p>
            <p>Please click the link below to verify your email address:</p>
            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p style="margin-top: 20px; color: #666;">This link will expire in 1 hour.</p>
          </div>
        `,
      });
    },
    expiresIn: 3600, // 1 hour
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
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
          await sendEmail({
            to: user.email,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>OTP Verification</h2>
                <p>Your OTP code is:</p>
                <div style="font-size: 32px; font-weight: bold; padding: 20px; background-color: #f0f0f0; text-align: center; letter-spacing: 5px;">
                  ${otp}
                </div>
                <p style="margin-top: 20px; color: #666;">This code will expire in 10 minutes.</p>
              </div>
            `,
          });
        },
      },
    }),
  ],
  session: {
    modelName: "session",
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  user: {
    modelName: "user",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    changeEmail: {
      enabled: true,
      async sendChangeEmailVerification(data, request) {
        await sendEmail({
          to: data.user.email,
          subject: "Verify Email Change",
          text: `Please verify your email change to ${data.newEmail} by clicking: ${data.url}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Email Change Verification</h2>
              <p>You requested to change your email to: <strong>${data.newEmail}</strong></p>
              <p>Please click the link below to confirm this change:</p>
              <a href="${data.url}" style="display: inline-block; padding: 10px 20px; background-color: #ffc107; color: black; text-decoration: none; border-radius: 5px;">Verify Email Change</a>
              <p style="margin-top: 20px; color: #666;">If you didn't request this, please ignore this email.</p>
            </div>
          `,
        });
      },
    },
  },
});

export const utils = {
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
        sessionToken = authSessionCookie.split('=')[1] || null;
      }
    }
    
    const response = await auth.api.getSession({
      headers,
    });
    
    // Enhance the user data if needed
    if (response?.user?.id) {
      // Add any additional user data here if needed
      // TODO: Add database query to fetch additional user data
      // const userWithRelations = await db.user.findFirst({ where: { id: response.user.id } });
    }
    
    // Add session token to response
    if (sessionToken && response) {
      (response as any).sessionToken = sessionToken;
    }
    
    return response;
  },
};

export type User = Partial<AuthUser> & {
  username?: string | null;
  role?: string | null;
};