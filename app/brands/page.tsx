import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { supabase } from "../lib/supabase";

export default async function BrandsPage() {
  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lime-400">
            Browse
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            Mountain Bike Brands
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-zinc-400">
            Browse every manufacturer currently tracked by MTB Market.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brands?.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-8 transition hover:-translate-y-1 hover:border-lime-400"
              >
                <h2 className="text-2xl font-bold group-hover:text-lime-400">
                  {brand.name}
                </h2>

                <p className="mt-3 text-zinc-400">
                  View models →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}