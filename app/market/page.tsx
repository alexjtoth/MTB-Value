import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export default function MarketPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.3em] text-lime-400">
            Market
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            Mountain bike market trends
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-zinc-400">
            This page will eventually show depreciation trends, average selling
            prices, brand performance, and historical value charts.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}