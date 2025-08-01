import { defineAPI } from "rlib/server";
import { utils } from "../lib/better-auth";

export default defineAPI({
  name: "get_session_with_token",
  url: "/api/get-session-with-token",
  async handler() {
    const req = this.req!;
    
    // Get the session data using better-auth
    const sessionData = await utils.getSession(req.headers);
    
    // Extract session token from cookie header
    let sessionToken = null;
    const cookieHeader = req.headers.get('cookie');
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
    
    return new Response(JSON.stringify({
      ...sessionData,
      sessionToken: sessionToken
    }), {
      headers: { "content-type": "application/json" },
    });
  },
});