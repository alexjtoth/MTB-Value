import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="mx-auto max-w-4xl px-6 py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lime-400">
            About MTB Market
          </p>

          <h1 className="mt-4 text-5xl font-bold tracking-tight">
            A better way to understand mountain bike value.
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-400">
            MTB Market is being built to help riders, sellers, and buyers
            understand what used mountain bikes are actually worth. The goal is
            to combine bike specs, original MSRP, depreciation, comparable
            listings, and market trends into one simple valuation tool.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <InfoCard title="Search bikes" text="Look up bikes by brand, model, category, and year." />
            <InfoCard title="Compare value" text="Estimate pricing using specs, MSRP, and future market data." />
            <InfoCard title="Buy smarter" text="Spot good deals and avoid overpaying for used bikes." />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  );
}