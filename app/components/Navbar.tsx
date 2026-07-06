import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-white">
        <Link href="/" className="text-xl font-bold">
          MTB Market
        </Link>

        <div className="hidden gap-6 text-sm text-zinc-400 sm:flex">
          <Link href="/">Search</Link>
          <span>Compare</span>
          <span>Brands</span>
          <span>Market</span>
        </div>
      </nav>
    </header>
  );
}