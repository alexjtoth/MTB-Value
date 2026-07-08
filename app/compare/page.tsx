import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export default function ComparePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.3em] text-lime-400">
            Compare
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            Compare mountain bikes
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-zinc-400">
            Soon you'll be able to compare geometry, suspension travel,
            components, and market value side-by-side.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}