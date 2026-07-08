import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../components/Footer";
import { Navbar } from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

type BikeVersion = {
  id: string;
  year: number;
  msrp: number | null;
};

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!brand) {
    notFound();
  }

  const { data: models } = await supabase
    .from("bike_models")
    .select(`
      *,
      bike_versions (
        id,
        year,
        msrp
      )
    `)
    .eq("brand_id", brand.id)
    .order("name");

  const totalVersions =
    models?.reduce((sum, model) => sum + (model.bike_versions?.length ?? 0), 0) ??
    0;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Link href="/brands" className="text-sm font-medium text-lime-400 hover:text-lime-300">
            ← All brands
          </Link>

          <section className="mt-10 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-lime-400">
              Brand
            </p>

            <h1 className="mt-4 text-6xl font-bold">{brand.name}</h1>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <BrandStat label="Models tracked" value={(models?.length ?? 0).toString()} />
              <BrandStat label="Bike versions" value={totalVersions.toString()} />
              <BrandStat label="Market status" value="Tracking" />
            </div>
          </section>

          <section className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-lime-400">
                  Models
                </p>
                <h2 className="mt-2 text-3xl font-bold">
                  Browse {brand.name} bikes
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {models?.map((model) => {
                const versions = (model.bike_versions ?? []) as BikeVersion[];
                const years = versions
                  .map((version) => version.year)
                  .filter(Boolean)
                  .sort((a, b) => a - b);

                const yearRange =
                  years.length === 0
                    ? "Years coming soon"
                    : years[0] === years[years.length - 1]
                    ? `${years[0]}`
                    : `${years[0]}–${years[years.length - 1]}`;

                return (
                  <Link
  key={model.id}
  href={`/brands/${brand.slug}/${model.slug}`}
  className="block rounded-3xl border border-zinc-800 bg-zinc-900 p-7 transition hover:-translate-y-1 hover:border-lime-400"
>
                    <p className="text-sm font-semibold uppercase tracking-wide text-lime-400">
                      {model.category}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold">{model.name}</h3>

                    <div className="mt-6 space-y-3 text-sm text-zinc-400">
                      <div className="flex justify-between border-b border-zinc-800 pb-3">
                        <span>Versions</span>
                        <span className="font-medium text-white">{versions.length}</span>
                      </div>

                      <div className="flex justify-between border-b border-zinc-800 pb-3">
                        <span>Years</span>
                        <span className="font-medium text-white">{yearRange}</span>
                      </div>
                    </div>

                    <p className="mt-6 text-sm font-medium text-lime-400">
                      View model →
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

function BrandStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}