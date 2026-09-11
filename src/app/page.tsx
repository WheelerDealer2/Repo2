import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/auth/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? null;
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold leading-none">Wheeler Dealer</h1>
      <p className="mb-8 mt-1.5 text-[#5a5d61]">
        The browse page (search, filters, listing grid) lands in a later step —
        this is just the auth scaffold for now.
      </p>

      {user ? (
        <div className="rounded-md border border-line bg-white p-5">
          <p className="text-sm text-[#5a5d61]">Logged in as</p>
          <p className="font-mono text-lg font-semibold">{displayName ?? user.email}</p>
          <p className="mt-0.5 text-sm text-[#5a5d61]">{user.email}</p>
          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-asphalt hover:bg-paper-dim"
            >
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-md border border-line px-4 py-2.5 text-sm font-semibold text-asphalt hover:bg-paper-dim"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-white hover:bg-signal-dark"
          >
            Sign up
          </Link>
        </div>
      )}
    </div>
  );
}
