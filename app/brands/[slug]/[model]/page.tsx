import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

type BikeVersion = {
  id: string;
  year: number;
  msrp: number | null;
  image_url: string | null;
  front_travel_mm: number | null;
  rear_travel_mm: number | null;
  wheel_size: string | null;
  frame_material: string | null;
};

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string; model: string }>;
}) {
  const { slug, model } = await params;

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!brand) notFound();

  const { data: bikeModel } = await supabase
    .from("bike_models")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("slug", model)
    .single();

  if (!bikeModel) notFound();

  const { data: versions } = await supabase
    .from("bike_versions")
    .select("*")
    .eq("bike_model_id", bikeModel.id)
    .order("year", { ascending: false });

  const bikeVersions = (versions ?? []) as BikeVersion[];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Link
            href={`/brands/${brand.slug}`}
            className="text-sm font-medium text-lime-400 hover:text-lime-300"
          >
            ← Back to {brand.name}
          </Link>

          <section className="mt-10 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-lime-400">
              {brand.name}
            </p>

            <h1 className="mt-4 text-6xl font-bold">{bikeModel.name}</h1>

            <p className="mt-5 text-lg text-zinc-400">
              {bikeModel.category} · {bikeVersions.length} versions tracked
            </p>
          </section>

          <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bikeVersions.map((version) => (
              <Link
                key={version.id}
                href={`/bike/${version.id}`}
                className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 transition hover:-translate-y-1 hover:border-lime-400"
              >
                {version.image_url ? (
                  <img
                    src={version.image_url}
                    alt={`${version.year} ${brand.name} ${bikeModel.name}`}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-zinc-950 text-zinc-500">
                    No image
                  </div>
                )}

                <div className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-lime-400">
                    {version.year}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {brand.name} {bikeModel.name}
                  </h2>

                  <p className="mt-4 text-3xl font-black">
                    {version.msrp
                      ? `$${Number(version.msrp).toLocaleString()}`
                      : "N/A"}
                  </p>

                  <p className="mt-4 text-sm text-zinc-400">
                    {version.front_travel_mm ?? "--"}/
                    {version.rear_travel_mm ?? "--"} mm ·{" "}
                    {version.wheel_size ?? "--"} ·{" "}
                    {version.frame_material ?? "--"}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}