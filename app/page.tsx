"use client";

import { useMemo, useState } from "react";

import { bikes } from "./data/bike";
import { BikeCard } from "./components/BikeCard";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";

export default function Home() {
  const [query, setQuery] = useState("");

  const filteredBikes = useMemo(() => {
    const search = query.toLowerCase();

    if (!search) return bikes;

    return bikes.filter((bike) => {
      const fullName =
        `${bike.year} ${bike.brand} ${bike.model} ${bike.category}`.toLowerCase();

      return fullName.includes(search);
    });
  }, [query]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="mx-auto flex max-w-5xl flex-col px-6 py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-lime-400">
            MTB Market
          </p>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
            Find the true value of your mountain bike.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-zinc-400">
            Search by brand, model, or year to estimate fair market value and
            compare similar used mountain bikes.
          </p>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-10 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-lg text-white outline-none ring-lime-400 placeholder:text-zinc-500 focus:ring-2"
            placeholder="Search: 2023 Propain Tyee"
          />

          <div className="mt-8 grid gap-4">
            {filteredBikes.map((bike) => (
              <BikeCard key={bike.slug} bike={bike} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}