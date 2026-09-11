import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/auth/actions";
import { LogoIcon } from "./icons";
import { SearchBox } from "./SearchBox";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

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
          <Link href="/messages" className="relative whitespace-nowrap text-sm font-semibold text-paper hover:underline">
            Messages
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-signal px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link href="/account" className="whitespace-nowrap text-sm font-semibold text-paper hover:underline">
            Account
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="whitespace-nowrap rounded-md border border-[#3a3d42] px-3 py-1.5 text-sm font-semibold text-paper hover:bg-[#232629]"
            >
              Log out
            </button>
          </form>
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
