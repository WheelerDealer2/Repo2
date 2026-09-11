import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/auth/actions";
import { createCheckoutSessionAction } from "@/lib/stripe/actions";
import { MarkSoldButton } from "@/components/MarkSoldButton";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { RemoveFavoriteButton } from "@/components/RemoveFavoriteButton";

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

  const { data: favoriteRows } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const favoriteListingIds = (favoriteRows ?? []).map((f) => f.listing_id);
  let myFavorites: { id: string; make: string; model: string; year: number; price: number; status: string }[] = [];
  if (favoriteListingIds.length > 0) {
    const { data } = await supabase
      .from("listings")
      .select("id, make, model, year, price, status")
      .in("id", favoriteListingIds);
    // Preserve favorited order (most recently saved first), not query order.
    const byId = new Map((data ?? []).map((l) => [l.id, l]));
    myFavorites = favoriteListingIds.map((id) => byId.get(id)).filter((l) => !!l);
  }

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
            <ul className="space-y-3">
              {myListings.map((l) => (
                <li key={l.id} className="rounded-md border border-line px-3 py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <Link href={`/listing/${l.id}`} className="font-mono font-semibold hover:underline">
                      {l.year} {l.make} {l.model}
                    </Link>
                    <span className="rounded bg-paper-dim px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-asphalt">
                      {l.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
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
                    <Link
                      href={`/listing/${l.id}/edit`}
                      className="rounded border border-line px-2 py-0.5 text-xs font-semibold text-asphalt hover:bg-paper-dim"
                    >
                      Edit
                    </Link>
                    {l.status === "active" && <MarkSoldButton listingId={l.id} />}
                    <DeleteListingButton listingId={l.id} label={`${l.year} ${l.make} ${l.model}`} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {myFavorites.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 text-sm font-semibold text-asphalt">Favorites</p>
            <ul className="space-y-2">
              {myFavorites.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2.5 text-sm"
                >
                  <Link href={`/listing/${l.id}`} className="min-w-0 flex-1 hover:underline">
                    <span className="font-mono font-semibold">
                      {l.year} {l.make} {l.model}
                    </span>
                    <span className="ml-2 font-mono text-signal-dark">${l.price.toLocaleString()}</span>
                    {l.status !== "active" && (
                      <span className="ml-2 rounded bg-paper-dim px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-asphalt">
                        {l.status.replace("_", " ")}
                      </span>
                    )}
                  </Link>
                  <RemoveFavoriteButton userId={user.id} listingId={l.id} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
