import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

type BikeVersion = {
  id: string;
  year: number;
  msrp: number | null;
};

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string; modelSlug: string }>;
}) {
  const { slug, modelSlug } = await params;

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  if (brandError || !brand) {
    notFound();
  }

  const { data: bikeModel, error: modelError } = await supabase
    .from("bike_models")
    .select("*")
    .eq("slug", modelSlug)
    .eq("brand_id", brand.id)
    .single();

  if (modelError || !bikeModel) {
    notFound();
  }

  const { data: versions, error: versionsError } = await supabase
    .from("bike_versions")
    .select("id, year, msrp")
    .eq("bike_model_id", bikeModel.id)
    .order("year", { ascending: false });

  if (versionsError) {
    console.error(versionsError);
  }

  const typedVersions = (versions ?? []) as BikeVersion[];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap gap-2 text-sm text-zinc-400">
            <Link href="/brands" className="hover:text-lime-400">
              Brands
            </Link>
            <span>/</span>
            <Link
              href={`/brands/${brand.slug}`}
              className="hover:text-lime-400"
            >
              {brand.name}
            </Link>
            <span>/</span>
            <span className="text-white">{bikeModel.name}</span>
          </div>

          <section className="mt-10 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-lime-400">
              Model
            </p>

            <h1 className="mt-4 text-6xl font-bold">
              {brand.name} {bikeModel.name}
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              Browse all tracked versions of this bike.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <ModelStat label="Brand" value={brand.name} />
              <ModelStat
                label="Category"
                value={bikeModel.category ?? "Unknown"}
              />
              <ModelStat
                label="Versions"
                value={typedVersions.length.toString()}
              />
            </div>
          </section>

          <section className="mt-10">
            <p className="text-sm uppercase tracking-[0.25em] text-lime-400">
              Versions
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Choose a year
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {typedVersions.map((version) => (
                <Link
                  key={version.id}
                  href={`/bike/${version.id}`}
                  className="block rounded-3xl border border-zinc-800 bg-zinc-900 p-7 transition hover:-translate-y-1 hover:border-lime-400"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-lime-400">
                    {bikeModel.category}
                  </p>

                  <h3 className="mt-3 text-3xl font-bold">
                    {version.year} {brand.name} {bikeModel.name}
                  </h3>

                  <div className="mt-6 flex justify-between border-t border-zinc-800 pt-4 text-sm">
                    <span className="text-zinc-400">MSRP</span>
                    <span className="font-medium text-white">
                      {version.msrp
                        ? `$${version.msrp.toLocaleString()}`
                        : "Coming soon"}
                    </span>
                  </div>

                  <p className="mt-6 text-sm font-medium text-lime-400">
                    View bike →
                  </p>
                </Link>
              ))}
            </div>

            {typedVersions.length === 0 && (
              <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">
                No versions added yet.
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

function ModelStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}