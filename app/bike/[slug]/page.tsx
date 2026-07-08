import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

export default async function BikePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: bike, error } = await supabase
    .from("bike_versions")
    .select(`
      *,
      bike_models (
        name,
        slug,
        category,
        brands (
          name
        )
      )
    `)
    .eq("id", slug)
    .single();

  if (error || !bike) {
    notFound();
  }

  const brand = bike.bike_models?.brands?.name ?? "Unknown";
  const model = bike.bike_models?.name ?? "";
  const category = bike.bike_models?.category ?? "";
  const value =
    bike.msrp != null ? `$${Number(bike.msrp).toLocaleString()}` : "N/A";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Link
            href="/"
            className="text-sm font-medium text-lime-400 hover:text-lime-300"
          >
            ← Back to search
          </Link>

          <section className="mt-8 overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl">
            {bike.image_url ? (
              <img
                src={bike.image_url}
                alt={`${bike.year} ${brand} ${model}`}
                className="h-[340px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[340px] items-center justify-center bg-zinc-900 text-zinc-500">
                No bike image yet
              </div>
            )}

            <div className="grid gap-8 p-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-lime-400">
                  {category}
                </p>

                <h1 className="mt-3 text-5xl font-bold tracking-tight">
                  {bike.year} {brand} {model}
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
                  Market valuation, specifications, depreciation tracking,
                  comparable bikes, and historical pricing all in one place.
                </p>
              </div>

              <div className="rounded-3xl border border-lime-400/30 bg-lime-400/10 p-7 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
                  Estimated Market Value
                </p>

                <p className="mt-3 text-5xl font-black text-lime-400">
                  {value}
                </p>

                <div className="mt-6 h-px bg-lime-400/20" />

                <p className="mt-6 text-sm leading-7 text-zinc-300">
                  Early estimate based on MSRP until marketplace listings,
                  depreciation models, and comparable sales are introduced.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Original MSRP" value={value} />
            <Stat
              label="Travel"
              value={`${bike.front_travel_mm ?? "--"}/${
                bike.rear_travel_mm ?? "--"
              } mm`}
            />
            <Stat label="Wheel Size" value={bike.wheel_size ?? "--"} />
            <Stat label="Frame" value={bike.frame_material ?? "--"} />
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
              <h2 className="text-2xl font-bold">Bike Details</h2>

              <div className="mt-6 space-y-3">
                <DetailRow label="Brand" value={brand} />
                <DetailRow label="Model" value={model} />
                <DetailRow label="Year" value={bike.year?.toString() ?? "--"} />
                <DetailRow label="Category" value={category} />
                <DetailRow
                  label="Front Travel"
                  value={`${bike.front_travel_mm ?? "--"} mm`}
                />
                <DetailRow
                  label="Rear Travel"
                  value={`${bike.rear_travel_mm ?? "--"} mm`}
                />
                <DetailRow label="Wheel Size" value={bike.wheel_size ?? "--"} />
                <DetailRow
                  label="Frame Material"
                  value={bike.frame_material ?? "--"}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
              <h2 className="text-2xl font-bold">Coming Soon</h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <FeatureCard
                  title="Deal Score"
                  description="Compare listing prices against market value."
                />

                <FeatureCard
                  title="Comparable Bikes"
                  description="Find bikes with similar geometry and pricing."
                />

                <FeatureCard
                  title="Price History"
                  description="See depreciation over multiple years."
                />

                <FeatureCard
                  title="Price Alerts"
                  description="Receive notifications when bikes reach your target price."
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 py-3">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-lime-400/40">
      <p className="font-semibold text-lime-400">{title}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}