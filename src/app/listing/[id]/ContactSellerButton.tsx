"use client";

import { useState } from "react";

export function ContactSellerButton() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="w-full rounded-md bg-signal px-3 py-3 text-[14.5px] font-semibold text-white hover:bg-signal-dark"
      >
        Contact seller
      </button>
      {revealed && (
        <div className="mt-2.5 rounded-md bg-paper-dim px-3 py-2.5 text-[13px]">
          Messaging isn&apos;t wired up yet — coming in the next step. In the
          real app, this opens a chat with the seller.
        </div>
      )}
    </div>
  );
}
