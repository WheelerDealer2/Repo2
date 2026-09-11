"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCheckoutSessionAction } from "@/lib/stripe/actions";
import { COLORS } from "@/lib/listings/colors";

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export function PostForm({ sellerId }: { sellerId: string }) {
  const [color, setColor] = useState(COLORS[0].hex);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readyToPay, setReadyToPay] = useState<{ id: string; make: string; model: string } | null>(null);

  // Object URLs derived from the current file list; revoked whenever the
  // list changes or the form unmounts, so we don't leak memory.
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

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

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
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
    }

    if (uploadErrors.length > 0) {
      // Don't auto-redirect past an error the user hasn't seen — let them
      // read it and continue to payment manually. The listing itself is
      // already saved either way.
      setSubmitting(false);
      setError(
        `Listing saved, but ${uploadErrors.length} photo(s) failed to upload: ${uploadErrors.join("; ")}. ` +
          "You can still continue to payment below.",
      );
      setReadyToPay({ id: listing.id, make: listing.make, model: listing.model });
      return;
    }

    // Straight to Stripe Checkout — createCheckoutSessionAction redirects
    // on success, so nothing after this call normally runs.
    await createCheckoutSessionAction(listing.id);
    setSubmitting(false);
  }

  if (readyToPay) {
    return (
      <div className="space-y-3">
        {error && (
          <div className="rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-sm font-medium text-rust">
            {error}
          </div>
        )}
        <button
          type="button"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            await createCheckoutSessionAction(readyToPay.id);
            setSubmitting(false);
          }}
          className="rounded-md bg-ink px-7 py-3 font-semibold text-white hover:bg-black disabled:opacity-60"
        >
          {submitting ? "Redirecting…" : `Continue to payment for ${readyToPay.make} ${readyToPay.model}`}
        </button>
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
        <Field label="Price (AUD)">
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
        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2.5">
            {previews.map((url, i) => (
              <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-md border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote/static asset */}
                <img src={url} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs font-bold text-white hover:bg-ink"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
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
