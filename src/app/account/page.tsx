import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/auth/actions";
import { createCheckoutSessionAction } from "@/lib/stripe/actions";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, make, model, year, status")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const myListings = listings ?? [];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-extrabold leading-none">Account</h1>
      <p className="mb-7 mt-1.5 text-[#5a5d61]">Your profile and listings.</p>

      <div className="rounded-md border border-line bg-white p-5">
        <p className="text-sm text-[#5a5d61]">Logged in as</p>
        <p className="font-mono text-lg font-semibold">{profile?.display_name ?? user.email}</p>
        <p className="mt-0.5 text-sm text-[#5a5d61]">{user.email}</p>
        <form action={signOutAction} className="mt-4">
          <button
            type="submit"
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-asphalt hover:bg-paper-dim"
          >
            Log out
          </button>
        </form>

        {myListings.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 text-sm font-semibold text-asphalt">Your listings</p>
            <ul className="space-y-1.5">
              {myListings.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span className="font-mono">
                    {l.year} {l.make} {l.model}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded bg-paper-dim px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-asphalt">
                      {l.status.replace("_", " ")}
                    </span>
                    {l.status === "pending_payment" && (
                      <form action={createCheckoutSessionAction.bind(null, l.id)}>
                        <button
                          type="submit"
                          className="rounded bg-signal px-2 py-0.5 text-xs font-semibold text-white hover:bg-signal-dark"
                        >
                          Pay to publish
                        </button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
