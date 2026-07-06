import Link from "next/link";

type Bike = {
  slug: string;
  year: number;
  brand: string;
  model: string;
  category: string;
  value: string;
};

export function BikeCard({ bike }: { bike: Bike }) {
  return (
    <Link
      href={`/bike/${bike.slug}`}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 transition hover:border-lime-400 hover:bg-zinc-900"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {bike.year} {bike.brand} {bike.model}
          </h2>
          <p className="mt-1 text-zinc-400">{bike.category}</p>
        </div>

        <div className="rounded-xl bg-lime-400 px-4 py-2 text-lg font-bold text-zinc-950">
          {bike.value}
        </div>
      </div>
    </Link>
  );
}