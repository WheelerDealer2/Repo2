"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RemoveFavoriteButton({ userId, listingId }: { userId: string; listingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const supabase = createClient();
    await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded border border-line px-2 py-0.5 text-xs font-semibold text-asphalt hover:bg-paper-dim disabled:opacity-60"
    >
      {pending ? "…" : "Remove"}
    </button>
  );
}
