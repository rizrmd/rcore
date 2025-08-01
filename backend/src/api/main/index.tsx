import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "home",
  url: "/",
  async handler() {
    return (
      <html>
        <head>
          <title>RCore Template</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <div style={{ padding: "20px", fontFamily: "system-ui" }}>
            <h1>Welcome to RCore Template</h1>
            <p>A modern full-stack application template built with:</p>
            <ul>
              <li>Bun Runtime</li>
              <li>React + TypeScript</li>
              <li>Tailwind CSS + Shadcn UI</li>
              <li>Prisma ORM</li>
              <li>Better Auth</li>
            </ul>
            <p>
              <a href="/api/health" style={{ color: "#0066cc" }}>Check API Health</a>
            </p>
          </div>
        </body>
      </html>
    );
  },
});