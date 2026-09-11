import Link from "next/link";
import { CarIcon, GaugeIcon, PinIcon } from "./icons";

export type ListingCardData = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  location: string;
  color: string | null;
  isNew: boolean;
  photoUrl: string | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const color = listing.color ?? "#2B2E33";
  const { isNew } = listing;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-asphalt"
    >
      <div className="relative flex h-[140px] items-center justify-center" style={{ background: `${color}22` }}>
        {isNew && (
          <span className="absolute left-2.5 top-2.5 rounded bg-caution px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
            New listing
          </span>
        )}
        {listing.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage signed URL, not a static/remote asset Next can optimize
          <img src={listing.photoUrl} alt={`${listing.year} ${listing.make} ${listing.model}`} className="h-full w-full object-cover" />
        ) : (
          <CarIcon color={color} size={90} />
        )}
      </div>
      <div className="border-t border-line px-4 pb-4 pt-3.5">
        <div className="font-display text-xl font-bold leading-tight">
          {listing.year} {listing.make} {listing.model}
        </div>
        <div className="mb-2.5 font-mono text-lg font-semibold text-signal-dark">
          ${listing.price.toLocaleString()}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[12.5px] text-[#5a5d61]">
            <GaugeIcon /> {listing.mileage.toLocaleString()} miles
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-[#5a5d61]">
            <PinIcon /> {listing.location}
          </div>
        </div>
      </div>
    </Link>
  );
}
