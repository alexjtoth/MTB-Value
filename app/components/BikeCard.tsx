import Link from "next/link";

type Bike = {
  slug: string;
  year: number;
  brand: string;
  model: string;
  category: string;
  value: number | string | null;
  imageUrl?: string | null;
};

export function BikeCard({ bike }: { bike: Bike }) {
  const formattedValue =
    bike.value === null || bike.value === undefined
      ? "N/A"
      : `$${Number(bike.value).toLocaleString()}`;

  return (
    <Link
      href={`/bike/${bike.slug}`}
      className="group block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition hover:-translate-y-1 hover:border-lime-400 hover:bg-zinc-900"
    >
      <div className="relative">
        {bike.imageUrl ? (
          <img
            src={bike.imageUrl}
            alt={`${bike.year} ${bike.brand} ${bike.model}`}
            className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-56 items-center justify-center bg-zinc-950 text-zinc-500">
            No Image
          </div>
        )}

        <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-zinc-200 backdrop-blur">
          {bike.year}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-lime-400">
            {bike.brand}
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-white">
            {bike.model}
          </h2>

          <p className="mt-2 text-sm text-zinc-400">{bike.category}</p>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-zinc-800 pt-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Estimated value
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formattedValue}
            </p>
          </div>

          <span className="rounded-full bg-lime-400 px-3 py-1 text-sm font-bold text-zinc-950">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
