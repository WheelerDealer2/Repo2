import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoIcon } from "./icons";
import { SearchBox } from "./SearchBox";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-50 flex flex-wrap items-center gap-5 bg-ink px-6 py-3.5">
      <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-2xl font-extrabold text-white">
        <LogoIcon />
        Wheeler Dealer
      </Link>

      <SearchBox />

      {user ? (
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/post"
            className="whitespace-nowrap rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-white hover:bg-signal-dark"
          >
            + Post a listing
          </Link>
          <Link href="/account" className="whitespace-nowrap text-sm font-semibold text-paper hover:underline">
            Account
          </Link>
        </div>
      ) : (
        <Link
          href="/login"
          className="whitespace-nowrap rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-white hover:bg-signal-dark"
        >
          Log in
        </Link>
      )}
    </nav>
  );
}
