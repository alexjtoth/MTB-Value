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
      className="block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition hover:border-lime-400"
    >
      {bike.imageUrl ? (
        <img
          src={bike.imageUrl}
          alt={`${bike.year} ${bike.brand} ${bike.model}`}
          className="h-52 w-full object-cover"
        />
      ) : (
        <div className="flex h-52 items-center justify-center bg-zinc-950 text-zinc-500">
          No Image
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {bike.year} {bike.brand} {bike.model}
            </h2>
            <p className="mt-1 text-zinc-400">{bike.category}</p>
          </div>

          <div className="rounded-xl bg-lime-400 px-4 py-2 text-lg font-bold text-zinc-950">
            {formattedValue}
          </div>
        </div>
      </div>
    </Link>
  );
}
