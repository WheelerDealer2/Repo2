import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PhotoGallery } from "./PhotoGallery";
import { ContactSellerButton } from "./ContactSellerButton";

const PHOTO_URL_TTL_SECONDS = 60 * 60;

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      "id, make, model, year, price, mileage, location, color, description, status, seller_id, created_at",
    )
    .eq("id", id)
    .single();

  if (error || !listing) {
    notFound();
  }

  const { data: seller } = await supabase
    .from("profiles")
    .select("display_name, location")
    .eq("id", listing.seller_id)
    .single();

  const { data: photos } = await supabase
    .from("listing_photos")
    .select("storage_path")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  let photoUrls: string[] = [];
  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path);
    const { data: signed } = await supabase.storage
      .from("listings")
      .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS);
    photoUrls = (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => !!u);
  }

  const isOwner = user?.id === listing.seller_id;
  const color = listing.color ?? "#2B2E33";
  const sellerName = seller?.display_name ?? "Unknown seller";
  const initials: string =
    sellerName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div>
      <Link
        href="/"
        className="mb-4.5 inline-flex items-center gap-1.5 text-sm font-semibold text-asphalt hover:underline"
      >
        ← Back to listings
      </Link>

      {isOwner && listing.status !== "active" && (
        <div className="mb-4 rounded-md border border-caution/50 bg-caution/10 px-4 py-2.5 text-sm font-medium text-asphalt">
          Only you can see this listing right now — status:{" "}
          {listing.status.replace("_", " ")}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <PhotoGallery
            photoUrls={photoUrls}
            color={color}
            alt={`${listing.year} ${listing.make} ${listing.model}`}
          />

          <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.05]">
            {listing.year} {listing.make} {listing.model}
          </h1>
          <div className="mb-4.5 font-mono text-2xl font-semibold text-signal-dark">
            ${listing.price.toLocaleString()}
          </div>

          <div className="mb-5 overflow-hidden rounded-lg border border-line">
            <SpecRow label="Year" value={String(listing.year)} />
            <SpecRow label="Mileage" value={`${listing.mileage.toLocaleString()} mi`} />
            <SpecRow label="Location" value={listing.location} last />
          </div>

          <p className="mb-6 text-[14.5px] leading-relaxed text-[#3a3d42]">
            {listing.description}
          </p>
        </div>

        <div className="h-fit rounded-lg border border-line bg-white p-5.5">
          <h4 className="mb-3.5 font-display text-lg font-bold">Seller</h4>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-asphalt font-display text-base font-bold text-white">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold">{sellerName}</div>
              <div className="text-xs text-[#5a5d61]">{seller?.location ?? listing.location}</div>
            </div>
          </div>
          <ContactSellerButton />
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex justify-between px-4 py-2.75 text-[13.5px] ${last ? "" : "border-b border-line"}`}
    >
      <span className="text-[#5a5d61]">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
