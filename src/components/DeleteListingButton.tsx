"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteListingButton({
  listingId,
  label,
}: {
  listingId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(`Delete ${label}? This can't be undone.`)) return;

    setPending(true);
    const supabase = createClient();

    // Clean up storage first — deleting the listing row only cascades
    // the listing_photos rows, not the actual files in the bucket.
    const { data: photos } = await supabase
      .from("listing_photos")
      .select("storage_path")
      .eq("listing_id", listingId);

    if (photos && photos.length > 0) {
      await supabase.storage.from("listings").remove(photos.map((p) => p.storage_path));
    }

    await supabase.from("listings").delete().eq("id", listingId);

    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded border border-rust/40 px-2 py-0.5 text-xs font-semibold text-rust hover:bg-rust/10 disabled:opacity-60"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
