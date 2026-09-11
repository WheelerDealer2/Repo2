import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReplyForm } from "./ReplyForm";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ listingId: string; otherId: string }>;
}) {
  const { listingId, otherId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/messages/${listingId}/${otherId}`);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, make, model, year")
    .eq("id", listingId)
    .single();

  const { data: other } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", otherId)
    .single();

  const { data: thread } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("listing_id", listingId)
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  if (!thread || thread.length === 0) {
    notFound();
  }

  // Mark incoming messages in this thread as read now that it's been opened.
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("listing_id", listingId)
    .eq("sender_id", otherId)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/messages" className="mb-4.5 inline-flex items-center gap-1.5 text-sm font-semibold text-asphalt hover:underline">
        ← Back to messages
      </Link>

      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold leading-tight">
          {listing ? `${listing.year} ${listing.make} ${listing.model}` : "Listing"}
        </h1>
        <p className="text-sm text-[#5a5d61]">
          Conversation with {other?.display_name ?? "Unknown"} ·{" "}
          <Link href={`/listing/${listingId}`} className="text-signal-dark hover:underline">
            View listing
          </Link>
        </p>
      </div>

      <div className="mb-5 space-y-2.5">
        {thread.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm ${
                  mine ? "bg-signal text-white" : "bg-white border border-line text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-[#5a5d61]"}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <ReplyForm listingId={listingId} recipientId={otherId} senderId={user.id} />
    </div>
  );
}
