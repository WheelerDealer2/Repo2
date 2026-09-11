import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MessageRow = {
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/messages");
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("listing_id, sender_id, recipient_id, body, created_at, read_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const rows = (messages ?? []) as MessageRow[];

  type Conversation = {
    listingId: string;
    otherId: string;
    lastBody: string;
    lastAt: string;
    unread: number;
  };

  const conversations = new Map<string, Conversation>();
  for (const m of rows) {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    const key = `${m.listing_id}:${otherId}`;
    const existing = conversations.get(key);
    const isUnread = m.recipient_id === user.id && !m.read_at;

    if (!existing) {
      conversations.set(key, {
        listingId: m.listing_id,
        otherId,
        lastBody: m.body,
        lastAt: m.created_at,
        unread: isUnread ? 1 : 0,
      });
    } else if (isUnread) {
      existing.unread += 1;
    }
  }

  const convoList = [...conversations.values()];

  const listingIds = [...new Set(convoList.map((c) => c.listingId))];
  const otherIds = [...new Set(convoList.map((c) => c.otherId))];

  const [{ data: listings }, { data: profiles }] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("listings").select("id, make, model, year").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; make: string; model: string; year: number }[] }),
    otherIds.length > 0
      ? supabase.from("profiles").select("id, display_name").in("id", otherIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ]);

  const listingById = new Map((listings ?? []).map((l) => [l.id, l]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-extrabold leading-none">Messages</h1>
      <p className="mb-7 mt-1.5 text-[#5a5d61]">Conversations grouped by listing.</p>

      {convoList.length === 0 ? (
        <div className="rounded-lg border border-line bg-white px-5 py-16 text-center text-[#5a5d61]">
          No messages yet.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {convoList.map((c) => {
            const listing = listingById.get(c.listingId);
            const other = profileById.get(c.otherId);
            return (
              <li key={`${c.listingId}:${c.otherId}`}>
                <Link
                  href={`/messages/${c.listingId}/${c.otherId}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-line bg-white px-4 py-3 hover:border-asphalt"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {listing ? `${listing.year} ${listing.make} ${listing.model}` : "Listing"}
                      </span>
                      {c.unread > 0 && (
                        <span className="rounded-full bg-signal px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#5a5d61]">with {other?.display_name ?? "Unknown"}</div>
                    <div className="mt-0.5 truncate text-sm text-asphalt">{c.lastBody}</div>
                  </div>
                  <div className="shrink-0 text-xs text-[#5a5d61]">
                    {new Date(c.lastAt).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
