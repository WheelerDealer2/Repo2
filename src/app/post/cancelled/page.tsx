import Link from "next/link";

export default function PostCancelledPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold leading-none">Payment cancelled</h1>
      <p className="mb-7 mt-1.5 text-[#5a5d61]">
        No charge was made. Your listing is saved as an unpaid draft — you
        can pay to publish it any time from the home page.
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
