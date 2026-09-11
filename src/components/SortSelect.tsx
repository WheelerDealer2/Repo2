"use client";

export function SortSelect({ initial }: { initial: string }) {
  return (
    <select
      name="sort"
      form="filters-form"
      defaultValue={initial}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded border border-line bg-white px-2.5 py-1.5 text-[13px]"
    >
      <option value="newest">Newest first</option>
      <option value="price-low">Price: low to high</option>
      <option value="price-high">Price: high to low</option>
      <option value="mileage-low">Mileage: low to high</option>
    </select>
  );
}
