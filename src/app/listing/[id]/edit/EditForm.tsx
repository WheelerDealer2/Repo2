"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COLORS } from "@/lib/listings/colors";

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

type Listing = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  location: string;
  color: string | null;
  description: string;
};

export function EditForm({
  listing,
  existingPhotos,
  nextSortOrder,
}: {
  listing: Listing;
  existingPhotos: { id: string; url: string }[];
  nextSortOrder: number;
}) {
  const router = useRouter();
  const [color, setColor] = useState(listing.color ?? COLORS[0].hex);
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>(existingPhotos);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const newPreviews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  useEffect(() => {
    return () => newPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [newPreviews]);

  const totalPhotoCount = photos.length + newFiles.length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can have up to ${MAX_PHOTOS} photos total (currently ${photos.length}).`);
      e.target.value = "";
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_PHOTO_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is over 8MB. Choose a smaller file.`);
      e.target.value = "";
      return;
    }

    setError(null);
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  async function removeExistingPhoto(photoId: string, storagePathGuess: string) {
    setRemovingPhotoId(photoId);
    const supabase = createClient();

    const { data: photoRow } = await supabase
      .from("listing_photos")
      .select("storage_path")
      .eq("id", photoId)
      .single();

    const storagePath = photoRow?.storage_path ?? storagePathGuess;
    if (storagePath) {
      await supabase.storage.from("listings").remove([storagePath]);
    }
    await supabase.from("listing_photos").delete().eq("id", photoId);

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setRemovingPhotoId(null);
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        make: String(formData.get("make")),
        model: String(formData.get("model")),
        year: Number(formData.get("year")),
        price: Number(formData.get("price")),
        mileage: Number(formData.get("mileage")),
        location: String(formData.get("location")),
        color,
        description: String(formData.get("description")),
      })
      .eq("id", listing.id);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    const uploadErrors: string[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
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
        .insert({ listing_id: listing.id, storage_path: path, sort_order: nextSortOrder + i });
      if (photoRowError) {
        uploadErrors.push(`${file.name}: ${photoRowError.message}`);
      }
    }

    setSubmitting(false);

    if (uploadErrors.length > 0) {
      setError(`Listing updated, but ${uploadErrors.length} new photo(s) failed: ${uploadErrors.join("; ")}`);
      return;
    }

    router.push(`/listing/${listing.id}`);
    router.refresh();
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
          <input name="make" type="text" required defaultValue={listing.make} className={inputClass} />
        </Field>
        <Field label="Model">
          <input name="model" type="text" required defaultValue={listing.model} className={inputClass} />
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
            defaultValue={listing.year}
            className={inputClass}
          />
        </Field>
        <Field label="Price (AUD)">
          <input name="price" type="number" required min={0} defaultValue={listing.price} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Mileage">
          <input
            name="mileage"
            type="number"
            required
            min={0}
            defaultValue={listing.mileage}
            className={inputClass}
          />
        </Field>
        <Field label="Location">
          <input name="location" type="text" required defaultValue={listing.location} className={inputClass} />
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
          defaultValue={listing.description}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <Field label={`Photos (${totalPhotoCount}/${MAX_PHOTOS})`}>
        {photos.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2.5">
            {photos.map((p) => (
              <div key={p.id} className="group relative h-20 w-20 overflow-hidden rounded-md border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage signed URL */}
                <img src={p.url} alt="Listing photo" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(p.id, "")}
                  disabled={removingPhotoId === p.id}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs font-bold text-white hover:bg-ink disabled:opacity-60"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {totalPhotoCount < MAX_PHOTOS && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-paper-dim file:px-3 file:py-2 file:text-sm file:font-semibold"
          />
        )}

        {newPreviews.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {newPreviews.map((url, i) => (
              <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-md border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={url} alt={`New photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  aria-label={`Remove new photo ${i + 1}`}
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
        {submitting ? "Saving…" : "Save changes"}
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
