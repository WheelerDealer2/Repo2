import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line px-6 py-6 text-sm text-[#5a5d61]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Wheeler Dealer</span>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
