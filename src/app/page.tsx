import { createClient } from "@/lib/supabase/server";
import { FiltersForm } from "@/components/FiltersForm";
import { SortSelect } from "@/components/SortSelect";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { SearchIcon } from "@/components/icons";

type SearchParams = {
  q?: string;
  make?: string;
  maxPrice?: string;
  minYear?: string;
  maxMileage?: string;
  sort?: string;
};

const PHOTO_URL_TTL_SECONDS = 60 * 60;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const make = sp.make ?? "";
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const minYear = sp.minYear ? Number(sp.minYear) : undefined;
  const maxMileage = sp.maxMileage ? Number(sp.maxMileage) : undefined;
  const sort = sp.sort ?? "newest";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("listings")
    .select("id, make, model, year, price, mileage, location, color, created_at")
    .eq("status", "active");

  if (q) {
    query = query.textSearch("search_text", q, { type: "websearch", config: "english" });
  }
  if (make) {
    query = query.eq("make", make);
  }
  if (maxPrice !== undefined && !Number.isNaN(maxPrice)) {
    query = query.lte("price", maxPrice);
  }
  if (minYear !== undefined && !Number.isNaN(minYear)) {
    query = query.gte("year", minYear);
  }
  if (maxMileage !== undefined && !Number.isNaN(maxMileage)) {
    query = query.lte("mileage", maxMileage);
  }

  switch (sort) {
    case "price-low":
      query = query.order("price", { ascending: true });
      break;
    case "price-high":
      query = query.order("price", { ascending: false });
      break;
    case "mileage-low":
      query = query.order("mileage", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const [{ data: listings }, { data: makeRows }] = await Promise.all([
    query,
    supabase.from("listings").select("make").eq("status", "active"),
  ]);

  const makes = [...new Set((makeRows ?? []).map((r) => r.make))].sort();

  const results = listings ?? [];
  const listingIds = results.map((l) => l.id);

  const photoByListingId = new Map<string, string>();
  if (listingIds.length > 0) {
    const { data: photos } = await supabase
      .from("listing_photos")
      .select("listing_id, storage_path, sort_order")
      .in("listing_id", listingIds)
      .order("sort_order", { ascending: true });

    const firstPhotoPath = new Map<string, string>();
    for (const photo of photos ?? []) {
      if (!firstPhotoPath.has(photo.listing_id)) {
        firstPhotoPath.set(photo.listing_id, photo.storage_path);
      }
    }

    if (firstPhotoPath.size > 0) {
      const paths = [...firstPhotoPath.values()];
      const { data: signedUrls } = await supabase.storage
        .from("listings")
        .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS);

      const urlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));
      for (const [listingId, path] of firstPhotoPath) {
        const url = urlByPath.get(path);
        if (url) photoByListingId.set(listingId, url);
      }
    }
  }

  let favoritedIds = new Set<string>();
  if (user && listingIds.length > 0) {
    const { data: favorites } = await supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .in("listing_id", listingIds);
    favoritedIds = new Set((favorites ?? []).map((f) => f.listing_id));
  }

  // eslint-disable-next-line react-hooks/purity -- async Server Component, evaluated once per request server-side; no client memoization applies
  const now = Date.now();
  const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
  const cards: ListingCardData[] = results.map((l) => ({
    ...l,
    isNew: now - new Date(l.created_at).getTime() < NEW_WINDOW_MS,
    isFavorited: favoritedIds.has(l.id),
    photoUrl: photoByListingId.get(l.id) ?? null,
  }));

  return (
    <div className="grid grid-cols-1 gap-7 md:grid-cols-[220px_1fr]">
      <FiltersForm
        makes={makes}
        initial={{
          q,
          make,
          maxPrice: sp.maxPrice ?? "",
          minYear: sp.minYear ?? "",
          maxMileage: sp.maxMileage ?? "",
        }}
      />

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <div className="text-sm text-[#5a5d61]">
            {cards.length} listing{cards.length === 1 ? "" : "s"}
          </div>
          <SortSelect initial={sort} />
        </div>

        {cards.length === 0 ? (
          <div className="rounded-lg border border-line bg-white px-5 py-16 text-center text-[#5a5d61]">
            <div className="mb-3.5 flex justify-center opacity-40">
              <SearchIcon />
            </div>
            <h3 className="mb-1.5 font-display text-xl font-bold text-ink">
              No listings match those filters
            </h3>
            <p>Try widening your search or clearing a filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((listing) => (
              <ListingCard key={listing.id} listing={listing} currentUserId={user?.id ?? null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
