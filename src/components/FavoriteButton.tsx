"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon } from "./icons";

export function FavoriteButton({
  listingId,
  currentUserId,
  initialFavorited,
  size = "sm",
}: {
  listingId: string;
  currentUserId: string | null;
  initialFavorited: boolean;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  if (!currentUserId) {
    return null;
  }

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    setPending(true);
    const supabase = createClient();
    const next = !favorited;

    if (next) {
      await supabase.from("favorites").insert({ user_id: currentUserId, listing_id: listingId });
    } else {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", currentUserId)
        .eq("listing_id", listingId);
    }

    setFavorited(next);
    setPending(false);
    router.refresh();
  }

  const dims = size === "lg" ? "h-9.5 w-9.5" : "h-8 w-8";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={favorited}
      className={`flex ${dims} items-center justify-center rounded-full bg-white/90 text-rust shadow-sm hover:bg-white disabled:opacity-60`}
    >
      <HeartIcon filled={favorited} />
    </button>
  );
}
