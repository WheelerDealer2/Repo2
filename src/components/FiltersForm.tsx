"use client";

import Link from "next/link";

function submitOnChange(e: React.SyntheticEvent<HTMLElement>) {
  (e.currentTarget as HTMLInputElement | HTMLSelectElement).form?.requestSubmit();
}

export function FiltersForm({
  makes,
  initial,
}: {
  makes: string[];
  initial: { q: string; make: string; maxPrice: string; minYear: string; maxMileage: string };
}) {
  return (
    <form
      id="filters-form"
      method="GET"
      action="/"
      className="sticky top-20 h-fit rounded-lg border border-line bg-white p-5"
    >
      {/* "sort" is submitted by SortSelect, which associates to this form via the form="filters-form" attribute */}
      <input type="hidden" name="q" value={initial.q} />

      <h3 className="mb-4 font-display text-lg font-bold">Filters</h3>

      <div className="mb-4.5">
        <label className="mb-1.5 block text-xs font-semibold text-[#5a5d61]">Make</label>
        <select
          name="make"
          defaultValue={initial.make}
          onChange={submitOnChange}
          className="w-full rounded border border-line bg-white px-2.5 py-2 text-[13px] text-ink"
        >
          <option value="">All makes</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4.5">
        <label className="mb-1.5 block text-xs font-semibold text-[#5a5d61]">Max price</label>
        <input
          type="number"
          name="maxPrice"
          min={0}
          defaultValue={initial.maxPrice}
          onBlur={submitOnChange}
          placeholder="No limit"
          className="w-full rounded border border-line bg-white px-2.5 py-2 text-[13px] text-ink"
        />
      </div>

      <div className="mb-4.5">
        <label className="mb-1.5 block text-xs font-semibold text-[#5a5d61]">Min year</label>
        <input
          type="number"
          name="minYear"
          min={1950}
          max={2100}
          defaultValue={initial.minYear}
          onBlur={submitOnChange}
          placeholder="Any year"
          className="w-full rounded border border-line bg-white px-2.5 py-2 text-[13px] text-ink"
        />
      </div>

      <div className="mb-4.5">
        <label className="mb-1.5 block text-xs font-semibold text-[#5a5d61]">Max mileage</label>
        <input
          type="number"
          name="maxMileage"
          min={0}
          defaultValue={initial.maxMileage}
          onBlur={submitOnChange}
          placeholder="No limit"
          className="w-full rounded border border-line bg-white px-2.5 py-2 text-[13px] text-ink"
        />
      </div>

      <Link
        href="/"
        className="block w-full rounded border border-line px-2 py-2 text-center text-[13px] font-semibold text-asphalt hover:bg-paper-dim"
      >
        Clear filters
      </Link>
    </form>
  );
}
