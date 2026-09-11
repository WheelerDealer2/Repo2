"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ContactSellerPanel({
  listingId,
  sellerId,
  currentUserId,
  isOwner,
}: {
  listingId: string;
  sellerId: string;
  currentUserId: string | null;
  isOwner: boolean;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (isOwner) {
    return (
      <p className="rounded-md bg-paper-dim px-3 py-2.5 text-[13px] text-[#5a5d61]">
        This is your listing — buyers will be able to message you here.
      </p>
    );
  }

  if (!currentUserId) {
    return (
      <Link
        href={`/login?redirect=/listing/${listingId}`}
        className="block w-full rounded-md bg-signal px-3 py-3 text-center text-[14.5px] font-semibold text-white hover:bg-signal-dark"
      >
        Log in to contact seller
      </Link>
    );
  }

  if (sent) {
    return (
      <div className="rounded-md border border-[#a9d4a9] bg-[#E8F4E8] px-3 py-2.5 text-[13px] font-semibold text-[#2c5c2c]">
        Message sent. The seller will see it once they check their messages.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("messages").insert({
      listing_id: listingId,
      sender_id: currentUserId,
      recipient_id: sellerId,
      body: body.trim(),
    });

    setSending(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-2.5 rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-xs font-medium text-rust">
          {error}
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={3}
        placeholder="Ask about condition, service history, availability..."
        className="mb-2.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-signal"
      />
      <button
        type="submit"
        disabled={sending || !body.trim()}
        className="w-full rounded-md bg-signal px-3 py-3 text-[14.5px] font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
