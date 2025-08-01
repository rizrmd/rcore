import { betterAuth } from "@/lib/better-auth";
import { Link } from "@/lib/router";
import { css } from "goober";
import { Button } from "../ui/button";

export default function () {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] py-12 space-y-4 md:space-y-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter text-center">
          Mohon Maaf
          <br /> Anda tidak memiliki akses.
        </h1>
        <div className="inline-flex items-center justify-center rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <img
            src="/img/forbidden.svg"
            className={css`
              max-height: 300px;
            `}
          />
        </div>
        <div>
          Anda tidak memiliki hak akses
          <br /> untuk halaman ini
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800  dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
        >
          Kembali ke halaman awal
        </Link>
        <div>atau</div>
        <Button
          onClick={async () =>
            betterAuth.signOut().finally(() => (window.location.href = "/"))
          }
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
