"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const COLORS = [
  { name: "Charcoal", hex: "#2B2E33" },
  { name: "Signal Blue", hex: "#2F6FED" },
  { name: "Rust Red", hex: "#C1440E" },
  { name: "Caution Yellow", hex: "#F2B705" },
  { name: "Slate", hex: "#5a5d61" },
  { name: "Paper White", hex: "#EDEBE4" },
];

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export function PostForm({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const [color, setColor] = useState(COLORS[0].hex);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ make: string; model: string; photoCount: number } | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    if (files.length > MAX_PHOTOS) {
      setError(`You can upload up to ${MAX_PHOTOS} photos (selected ${files.length}).`);
      setPhotos([]);
      e.target.value = "";
      return;
    }

    const tooBig = files.find((f) => f.size > MAX_PHOTO_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is over 8MB. Choose a smaller file.`);
      setPhotos([]);
      e.target.value = "";
      return;
    }

    setError(null);
    setPhotos(files);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert({
        seller_id: sellerId,
        make: String(formData.get("make")),
        model: String(formData.get("model")),
        year: Number(formData.get("year")),
        price: Number(formData.get("price")),
        mileage: Number(formData.get("mileage")),
        location: String(formData.get("location")),
        color,
        description: String(formData.get("description")),
      })
      .select("id, make, model")
      .single();

    if (insertError || !listing) {
      setError(insertError?.message ?? "Couldn't create the listing. Try again.");
      setSubmitting(false);
      return;
    }

    let uploadedCount = 0;
    const uploadErrors: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const path = `${listing.id}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("listings")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        uploadErrors.push(`${file.name}: ${uploadError.message}`);
        continue;
      }

      const { error: photoRowError } = await supabase
        .from("listing_photos")
        .insert({ listing_id: listing.id, storage_path: path, sort_order: i });

      if (photoRowError) {
        uploadErrors.push(`${file.name}: ${photoRowError.message}`);
        continue;
      }

      uploadedCount++;
    }

    setSubmitting(false);

    if (uploadErrors.length > 0) {
      setError(
        `Listing saved, but ${uploadErrors.length} photo(s) failed to upload: ${uploadErrors.join("; ")}`,
      );
    }

    setSuccess({ make: listing.make, model: listing.model, photoCount: uploadedCount });
    router.refresh();
  }

  if (success) {
    return (
      <div className="rounded-md border border-[#a9d4a9] bg-[#E8F4E8] px-4 py-3 text-sm font-semibold text-[#2c5c2c]">
        Listing created: {success.make} {success.model} ({success.photoCount} photo
        {success.photoCount === 1 ? "" : "s"} uploaded). It&apos;s saved as a draft —
        payment to make it live is coming in the next step.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-sm font-medium text-rust">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Make">
          <input name="make" type="text" required placeholder="e.g. Toyota" className={inputClass} />
        </Field>
        <Field label="Model">
          <input name="model" type="text" required placeholder="e.g. Corolla" className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Year">
          <input
            name="year"
            type="number"
            required
            min={1950}
            max={2100}
            placeholder="2020"
            className={inputClass}
          />
        </Field>
        <Field label="Price (USD)">
          <input name="price" type="number" required min={0} placeholder="18500" className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Mileage">
          <input name="mileage" type="number" required min={0} placeholder="42000" className={inputClass} />
        </Field>
        <Field label="Location">
          <input name="location" type="text" required placeholder="City, State" className={inputClass} />
        </Field>
      </div>

      <Field label="Color">
        <div className="mt-1 flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => setColor(c.hex)}
              className="h-8.5 w-8.5 rounded-full"
              style={{
                backgroundColor: c.hex,
                border: color === c.hex ? "2px solid var(--color-signal)" : "2px solid transparent",
                boxShadow: "0 0 0 1px var(--color-line)",
              }}
            />
          ))}
        </div>
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          required
          rows={4}
          placeholder="Condition, service history, any details a buyer should know..."
          className={`${inputClass} resize-y`}
        />
      </Field>

      <Field label={`Photos (up to ${MAX_PHOTOS})`}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
          className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-paper-dim file:px-3 file:py-2 file:text-sm file:font-semibold"
        />
        {photos.length > 0 && (
          <p className="mt-1 text-xs text-[#5a5d61]">{photos.length} photo(s) selected.</p>
        )}
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-md bg-ink px-7 py-3 font-semibold text-white hover:bg-black disabled:opacity-60"
      >
        {submitting ? "Posting…" : "Post listing"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-signal";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-asphalt">{label}</span>
      {children}
    </label>
  );
}
