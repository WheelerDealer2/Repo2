"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ReplyForm({
  listingId,
  recipientId,
  senderId,
}: {
  listingId: string;
  recipientId: string;
  senderId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("messages").insert({
      listing_id: listingId,
      sender_id: senderId,
      recipient_id: recipientId,
      body: body.trim(),
    });

    setSending(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-2.5 rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-xs font-medium text-rust">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={2}
          placeholder="Write a reply..."
          className="flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-signal"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="shrink-0 rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </form>
  );
}
