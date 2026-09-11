"use client";

import { useState } from "react";
import { CarIcon } from "@/components/icons";

export function PhotoGallery({
  photoUrls,
  color,
  alt,
}: {
  photoUrls: string[];
  color: string;
  alt: string;
}) {
  const [selected, setSelected] = useState(0);

  if (photoUrls.length === 0) {
    return (
      <div
        className="flex h-80 items-center justify-center rounded-lg"
        style={{ background: `${color}22` }}
      >
        <CarIcon color={color} size={200} />
      </div>
    );
  }

  return (
    <div>
      <div className="h-80 overflow-hidden rounded-lg" style={{ background: `${color}22` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage signed URL, not a static/remote asset Next can optimize */}
        <img src={photoUrls[selected]} alt={alt} className="h-full w-full object-cover" />
      </div>
      {photoUrls.length > 1 && (
        <div className="mt-2.5 flex gap-2 overflow-x-auto">
          {photoUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Photo ${i + 1}`}
              className="h-16 w-16 shrink-0 overflow-hidden rounded-md border-2"
              style={{ borderColor: i === selected ? "var(--color-signal)" : "transparent" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage signed URL */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
