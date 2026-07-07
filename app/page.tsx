"use client";

import { useMemo, useState } from "react";

import { useBikeVersions } from "../hooks/useBikeVersions";
import { BikeGrid } from "./components/BikeGrid";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";

export default function Home() {
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const { bikeVersions, loading } = useBikeVersions();

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        bikeVersions
          .map((bike) => bike.bike_models?.brands?.name)
          .filter((brand): brand is string => Boolean(brand))
      )
    ).sort();
  }, [bikeVersions]);

  const models = useMemo(() => {
    return Array.from(
      new Set(
        bikeVersions
          .filter((bike) => {
            const brand = bike.bike_models?.brands?.name ?? "";
            return !brandFilter || brand === brandFilter;
          })
          .map((bike) => bike.bike_models?.name)
          .filter((model): model is string => Boolean(model))
      )
    ).sort();
  }, [bikeVersions, brandFilter]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        bikeVersions
          .map((bike) => bike.bike_models?.category)
          .filter((category): category is string => Boolean(category))
      )
    ).sort();
  }, [bikeVersions]);

  const years = useMemo(() => {
    return Array.from(
      new Set(bikeVersions.map((bike) => bike.year).filter(Boolean))
    ).sort((a, b) => b - a);
  }, [bikeVersions]);

  const filteredBikes = useMemo(() => {
    const search = query.trim().toLowerCase();

    return bikeVersions.filter((bike) => {
      const brand = bike.bike_models?.brands?.name ?? "";
      const model = bike.bike_models?.name ?? "";
      const category = bike.bike_models?.category ?? "";
      const year = bike.year?.toString() ?? "";

      const fullName = `${year} ${brand} ${model} ${category}`.toLowerCase();

      const matchesSearch = !search || fullName.includes(search);
      const matchesBrand = !brandFilter || brand === brandFilter;
      const matchesModel = !modelFilter || model === modelFilter;
      const matchesCategory = !categoryFilter || category === categoryFilter;
      const matchesYear = !yearFilter || year === yearFilter;

      return (
        matchesSearch &&
        matchesBrand &&
        matchesModel &&
        matchesCategory &&
        matchesYear
      );
    });
  }, [
    query,
    brandFilter,
    modelFilter,
    categoryFilter,
    yearFilter,
    bikeVersions,
  ]);

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

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <select
              value={brandFilter}
              onChange={(event) => {
                setBrandFilter(event.target.value);
                setModelFilter("");
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-lime-400 focus:ring-2"
            >
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={modelFilter}
              onChange={(event) => setModelFilter(event.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-lime-400 focus:ring-2"
            >
              <option value="">All models</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-lime-400 focus:ring-2"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-lime-400 focus:ring-2"
            >
              <option value="">All years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {(query ||
            brandFilter ||
            modelFilter ||
            categoryFilter ||
            yearFilter) && (
            <button
              onClick={() => {
                setQuery("");
                setBrandFilter("");
                setModelFilter("");
                setCategoryFilter("");
                setYearFilter("");
              }}
              className="mt-4 w-fit rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-lime-400 hover:text-lime-400"
            >
              Clear filters
            </button>
          )}

          <div className="mt-8">
            {loading ? (
              <p className="text-zinc-400">Loading bikes...</p>
            ) : filteredBikes.length === 0 ? (
              <p className="text-zinc-400">
                No bikes found. Try adjusting your search or filters.
              </p>
            ) : (
              <BikeGrid bikes={filteredBikes} />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}