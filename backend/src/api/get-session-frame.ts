import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "get-session-frame",
  url: "/api/get-session-frame",
  async handler(_: any) {
    return new Response(
      `\
<script>
fetch('/api/get-session-with-token', { credentials: 'include' }).then(async (response) => {
    const data = await response.json();
    
    // Send session data along with the cookie value
    window.parent.postMessage(
      { 
        action: "session", 
        user: data.user,
        session: data.session,
        sessionCookie: data.sessionToken
      },
      "*"
    );
}).catch(error => {
    window.parent.postMessage(
      { 
        action: "session", 
        user: null,
        session: null,
        sessionCookie: null
      },
      "*"
    );
});
window.onmessage = (e) => {
  if (e.data === 'signout') {
    fetch('/api/auth/sign-out', {method: 'POST', body: '{}'}).then(() => {
      window.parent.postMessage(
        { action: "signout" },
        "*"
      );
    })
  }
}
</script>`,
      {
        headers: { "content-type": "text/html" },
      }
    );
  },
});
