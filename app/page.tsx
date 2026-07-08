"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useBikeVersions } from "../hooks/useBikeVersions";
import { BikeGrid } from "./components/BikeGrid";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { StatCard } from "./components/StatCard";
import { BikeCardSkeleton } from "./components/BikeCardSkeleton";

export default function Home() {
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const suggestions = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (search.length < 2) return [];

    return bikeVersions
      .filter((bike) => {
        const brand = bike.bike_models?.brands?.name ?? "";
        const model = bike.bike_models?.name ?? "";
        const category = bike.bike_models?.category ?? "";
        const year = bike.year?.toString() ?? "";

        const fullName = `${year} ${brand} ${model} ${category}`.toLowerCase();

        return fullName.includes(search);
      })
      .slice(0, 6);
  }, [query, bikeVersions]);

  const filteredBikes = useMemo(() => {
    const search = query.trim().toLowerCase();

    return bikeVersions.filter((bike) => {
      const brand = bike.bike_models?.brands?.name ?? "";
      const model = bike.bike_models?.name ?? "";
      const category = bike.bike_models?.category ?? "";
      const year = bike.year?.toString() ?? "";

      const fullName = `${year} ${brand} ${model} ${category}`.toLowerCase();

      return (
        (!search || fullName.includes(search)) &&
        (!brandFilter || brand === brandFilter) &&
        (!modelFilter || model === modelFilter) &&
        (!categoryFilter || category === categoryFilter) &&
        (!yearFilter || year === yearFilter)
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

  const averageValue = useMemo(() => {
    const values = filteredBikes
      .map((bike) => Number(bike.msrp))
      .filter((value) => !Number.isNaN(value) && value > 0);

    if (values.length === 0) return "N/A";

    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return `$${Math.round(avg).toLocaleString()}`;
  }, [filteredBikes]);

  const newestYear = useMemo(() => {
    const validYears = filteredBikes
      .map((bike) => Number(bike.year))
      .filter((year) => !Number.isNaN(year));

    if (validYears.length === 0) return "N/A";

    return Math.max(...validYears).toString();
  }, [filteredBikes]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="mx-auto flex max-w-6xl flex-col px-6 py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-lime-400">
            MTB Market
          </p>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
            Find the true value of your mountain bike.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-zinc-400">
            Search by brand, model, or year to estimate fair market value and
            compare similar used mountain bikes.
          </p>

          <div className="relative mt-10">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-lg text-white outline-none ring-lime-400 placeholder:text-zinc-500 focus:ring-2"
              placeholder="Search: 2023 Propain Tyee"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                {suggestions.map((bike) => {
                  const brand = bike.bike_models?.brands?.name ?? "";
                  const model = bike.bike_models?.name ?? "";
                  const year = bike.year ?? "";
                  const category = bike.bike_models?.category ?? "";
                  const slug = `${brand}-${model}`
  .toLowerCase()
  .replaceAll(" ", "-")
  .replaceAll("/", "-");

                  return (
                    <Link
                      key={bike.id}
                      href={slug ? `/bike/${slug}` : "#"}
                      onClick={() => setShowSuggestions(false)}
                      className="block border-b border-zinc-800 px-5 py-4 hover:bg-zinc-800"
                    >
                      <div className="font-semibold text-white">
                        {year} {brand} {model}
                      </div>
                      <div className="text-sm text-zinc-400">{category}</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

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
                setShowSuggestions(false);
              }}
              className="mt-4 w-fit rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-lime-400 hover:text-lime-400"
            >
              Clear filters
            </button>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Bikes tracked"
              value={filteredBikes.length.toString()}
            />
            <StatCard label="Average value" value={averageValue} />
            <StatCard label="Newest year" value={newestYear} />
          </div>

          <div className="mt-10 flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-lime-400">
                Search results
              </p>
              <h2 className="mt-2 text-3xl font-bold">Browse the market</h2>
            </div>

            <p className="text-sm text-zinc-400">
              Showing {filteredBikes.length} bikes
            </p>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <BikeCardSkeleton key={index} />
                ))}
              </div>
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