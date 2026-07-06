import Link from "next/link";
import { notFound } from "next/navigation";
import { bikes } from "../../data/bike";

export default async function BikePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bike = bikes.find((bike) => bike.slug === slug);

  if (!bike) notFound();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/" className="text-sm text-lime-400 hover:text-lime-300">
          ← Back to Search
        </Link>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
            <div className="mb-8 flex h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-500">
              Bike Image Placeholder
            </div>

            <p className="text-sm uppercase tracking-[0.3em] text-lime-400">
              {bike.category}
            </p>

            <h1 className="mt-4 text-5xl font-bold">
              {bike.year} {bike.brand} {bike.model}
            </h1>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Stat label="Original MSRP" value={bike.msrp} />
              <Stat label="Depreciation" value={bike.depreciation} />
              <Stat label="Travel" value={bike.travel} />
              <Stat label="Wheel Size" value={bike.wheelSize} />
              <Stat label="Frame" value={bike.frame} />
              <Stat label="Confidence" value={bike.confidence} />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-lime-400 p-8 text-zinc-950">
              <p className="text-sm font-semibold uppercase">
                Estimated Market Value
              </p>
              <p className="mt-2 text-5xl font-bold">{bike.value}</p>
              <p className="mt-4 text-sm font-medium">
                Based on comparable used bike sales and market trends.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-xl font-semibold">Market Pulse</h2>

              <div className="mt-5 space-y-4">
                <MiniStat label="90-Day Trend" value={bike.trend} />
                <MiniStat label="Demand" value={bike.demand} />
                <MiniStat label="Avg. Days to Sell" value="11 days" />
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold">Price History</h2>

            <div className="mt-6 flex h-56 items-end gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <Bar height="35%" label="2023" />
              <Bar height="55%" label="2024" />
              <Bar height="48%" label="2025" />
              <Bar height="65%" label="Now" />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold">Recent Comparable Sales</h2>

            <div className="mt-6 space-y-4">
              <Sale location="Colorado" price="$3,700" date="June 2026" />
              <Sale location="Utah" price="$3,550" date="May 2026" />
              <Sale location="California" price="$3,600" date="April 2026" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4">
      <p className="text-zinc-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Bar({ height, label }: { height: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-3">
      <div className="w-full rounded-t-xl bg-lime-400" style={{ height }} />
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function Sale({
  location,
  price,
  date,
}: {
  location: string;
  price: string;
  date: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4">
      <div>
        <p className="font-medium">{location}</p>
        <p className="text-sm text-zinc-500">{date}</p>
      </div>
      <p className="text-lg font-bold text-lime-400">{price}</p>
    </div>
  );
}
