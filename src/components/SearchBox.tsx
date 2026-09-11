"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "./icons";

export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set("q", String(q));
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 min-w-[180px] items-center gap-2 rounded-md border border-[#3a3d42] bg-[#232629] px-3 py-2.5"
    >
      <SearchIcon />
      <input
        name="q"
        type="search"
        placeholder="Search make, model, or keyword..."
        defaultValue={searchParams.get("q") ?? ""}
        className="w-full bg-transparent text-sm text-paper placeholder:text-[#8a8d92] outline-none"
      />
    </form>
  );
}
