"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MarkSoldButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const supabase = createClient();
    await supabase.from("listings").update({ status: "sold" }).eq("id", listingId);
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded bg-asphalt px-2 py-0.5 text-xs font-semibold text-white hover:bg-ink disabled:opacity-60"
    >
      {pending ? "…" : "Mark as sold"}
    </button>
  );
}
