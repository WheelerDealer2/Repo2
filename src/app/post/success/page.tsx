import Link from "next/link";

export default function PostSuccessPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold leading-none">Payment received</h1>
      <p className="mb-7 mt-1.5 text-[#5a5d61]">
        Thanks! Your listing will switch to active as soon as we finish
        confirming the payment — usually within a few seconds, sometimes up
        to a minute.
      </p>
      <Link
        href="/"
        className="inline-block rounded-md bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-black"
      >
        Back to home
      </Link>
    </div>
  );
}
