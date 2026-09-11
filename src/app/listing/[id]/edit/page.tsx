import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditForm } from "./EditForm";

const PHOTO_URL_TTL_SECONDS = 60 * 60;

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/listing/${id}/edit`);
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, make, model, year, price, mileage, location, color, description, status, seller_id")
    .eq("id", id)
    .single();

  if (error || !listing) {
    notFound();
  }

  if (listing.seller_id !== user.id) {
    redirect(`/listing/${id}`);
  }

  const { data: photos } = await supabase
    .from("listing_photos")
    .select("id, storage_path, sort_order")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  const photoRows = photos ?? [];
  let existingPhotos: { id: string; url: string }[] = [];
  if (photoRows.length > 0) {
    const paths = photoRows.map((p) => p.storage_path);
    const { data: signed } = await supabase.storage
      .from("listings")
      .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS);
    const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    existingPhotos = photoRows
      .map((p) => ({ id: p.id, url: urlByPath.get(p.storage_path) ?? "" }))
      .filter((p) => p.url);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-extrabold leading-none">Edit listing</h1>
      <p className="mb-7 mt-1.5 text-[#5a5d61]">
        {listing.year} {listing.make} {listing.model}
      </p>
      <EditForm listing={listing} existingPhotos={existingPhotos} nextSortOrder={photoRows.length} />
    </div>
  );
}
