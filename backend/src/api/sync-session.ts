import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "sync_session",
  url: "/api/sync-session",
  async handler({ sessionToken, action }: { sessionToken?: string; action?: string }) {
    const req = this.req!;
    // Get better-auth cookie options
    const isSecure = req.headers.get('x-forwarded-proto') === 'https' || 
                     new URL(req.url).protocol === 'https:';
    
    // Handle logout - clear cookie
    if (action === 'clear' || !sessionToken) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": `${isSecure ? '__Secure-' : ''}better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`,
        },
      });
    }
    
    // Set the same cookie on the current domain
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": `${isSecure ? '__Secure-' : ''}better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax${isSecure ? '; Secure' : ''}`,
      },
    });
  },
});