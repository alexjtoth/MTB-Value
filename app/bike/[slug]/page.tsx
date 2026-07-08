import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { supabase } from "../../lib/supabase";
import {
  geometryMatchScore,
  geometryDifferences,
} from "../../lib/geometrymatch";

export default async function BikePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ size?: string }>;
}) {
  const { slug } = await params;
  const { size } = await searchParams;

  const { data: bike, error } = await supabase
    .from("bike_versions")
    .select(`
      *,
      bike_models (
        name,
        slug,
        category,
        brands (
          name
        )
      ),
      bike_values (
        excellent_value,
        good_value,
        fair_value,
        poor_value,
        retention_percent
      ),
      bike_version_components (
        id,
        component_role,
        notes,
        components (
          brand,
          name,
          category,
          model_year,
          msrp
        )
      ),
      bike_geometry (
        id,
        size,
        reach_mm,
        stack_mm,
        wheelbase_mm,
        chainstay_mm,
        bb_drop_mm,
        head_tube_angle,
        seat_tube_angle,
        seat_tube_mm,
        head_tube_mm
      )
    `)
    .eq("id", slug)
    .single();

  if (error || !bike) {
    notFound();
  }

  const brand = bike.bike_models?.brands?.name ?? "Unknown";
  const model = bike.bike_models?.name ?? "";
  const category = bike.bike_models?.category ?? "";

  const msrp = bike.msrp != null ? Number(bike.msrp) : null;
  const currentYear = new Date().getFullYear();
  const bikeAge = bike.year ? Math.max(currentYear - bike.year, 0) : 0;

  const estimatedMarketValue =
    msrp != null
      ? Math.round(msrp * Math.max(0.28, 0.72 * Math.pow(0.88, bikeAge)))
      : null;

  const value =
    estimatedMarketValue != null
      ? `$${estimatedMarketValue.toLocaleString()}`
      : "N/A";

  const msrpValue = msrp != null ? `$${msrp.toLocaleString()}` : "N/A";

  const valueRetained =
    msrp != null && estimatedMarketValue != null
      ? Math.round((estimatedMarketValue / msrp) * 100)
      : null;

  const depreciation = valueRetained != null ? 100 - valueRetained : null;

  const components = bike.bike_version_components ?? [];
  const bikeValue = Array.isArray(bike.bike_values)
  ? bike.bike_values[0]
  : bike.bike_values;
  const geometry = bike.bike_geometry ?? [];

  const selectedGeometry =
    geometry.find((geo: any) => geo.size === size) ?? geometry[0] ?? null;

  const { data: allBikes } = await supabase
    .from("bike_versions")
    .select(`
      *,
      bike_models (
        name,
        slug,
        category,
        brands (
          name
        )
      ),
      bike_geometry (
        id,
        size,
        reach_mm,
        stack_mm,
        wheelbase_mm,
        chainstay_mm,
        bb_drop_mm,
        head_tube_angle,
        seat_tube_angle,
        seat_tube_mm,
        head_tube_mm
      )
    `)
    .neq("id", bike.id);

  const geometryMatches =
    selectedGeometry && allBikes
      ? allBikes
          .map((otherBike: any) => {
            const bestGeometryMatch = otherBike.bike_geometry
              ?.map((otherGeometry: any) => {
                const currentBikeGeometry = {
                  ...selectedGeometry,
                  front_travel_mm: bike.front_travel_mm,
                  rear_travel_mm: bike.rear_travel_mm,
                };

                const comparisonBikeGeometry = {
                  ...otherGeometry,
                  front_travel_mm: otherBike.front_travel_mm,
                  rear_travel_mm: otherBike.rear_travel_mm,
                };

                const score = geometryMatchScore(
                  currentBikeGeometry,
                  comparisonBikeGeometry
                );

                const differences = geometryDifferences(
                  currentBikeGeometry,
                  comparisonBikeGeometry
                );

                return {
                  geometry: otherGeometry,
                  score,
                  differences,
                };
              })
              .sort((a: any, b: any) => b.score - a.score)[0];

            if (!bestGeometryMatch) return null;

            return {
              bike: otherBike,
              geometry: bestGeometryMatch.geometry,
              score: bestGeometryMatch.score,
              differences: bestGeometryMatch.differences,
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 4)
      : [];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Link
            href="/"
            className="text-sm font-medium text-lime-400 hover:text-lime-300"
          >
            ← Back to search
          </Link>

          <section className="mt-8 overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl">
            {bike.image_url ? (
              <img
                src={bike.image_url}
                alt={`${bike.year} ${brand} ${model}`}
                className="h-[340px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[340px] items-center justify-center bg-zinc-900 text-zinc-500">
                No bike image yet
              </div>
            )}

            <div className="grid gap-8 p-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-lime-400">
                  {category}
                </p>

                <h1 className="mt-3 text-5xl font-bold tracking-tight">
                  {bike.year} {brand} {model}
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
                  Market valuation, specifications, depreciation tracking,
                  comparable bikes, and historical pricing all in one place.
                </p>
              </div>

              <div className="rounded-3xl border border-lime-400/30 bg-lime-400/10 p-7 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
                  Estimated Used Value
                </p>

                <p className="mt-3 text-5xl font-black text-lime-400">
                  {bikeValue?.good_value
                    ? `$${bikeValue.good_value.toLocaleString()}`
                    : value}
                </p>

                <div className="mt-6 h-px bg-lime-400/20" />

                <div className="mt-6 space-y-3">
                  <ValueRow
                    label="Excellent"
                    value={bikeValue?.excellent_value}
                  />
                  <ValueRow label="Good" value={bikeValue?.good_value} />
                  <ValueRow label="Fair" value={bikeValue?.fair_value} />
                  <ValueRow label="Poor" value={bikeValue?.poor_value} />
                </div>

                {bikeValue?.retention_percent && (
                  <p className="mt-5 text-sm text-zinc-300">
                    Retains{" "}
                    <span className="font-bold text-lime-400">
                      {Number(bikeValue.retention_percent)}%
                    </span>{" "}
                    of original MSRP.
                  </p>
                )}

                <Link
                  href={`/compare?bike=${bike.id}`}
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black transition hover:bg-lime-300"
                >
                  Compare Bike
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Original MSRP" value={msrpValue} />
            <Stat
              label="Travel"
              value={`${bike.front_travel_mm ?? "--"}/${
                bike.rear_travel_mm ?? "--"
              } mm`}
            />
            <Stat
              label="Wheel Size"
              value={bike.wheel_size ? `${bike.wheel_size}` : "--"}
            />
            <Stat label="Frame" value={bike.frame_material ?? "--"} />
          </section>

          {valueRetained != null && depreciation != null && (
            <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-400">
                    Value Retention
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {valueRetained}% of original MSRP retained
                  </h2>

                  <p className="mt-3 text-zinc-400">
                    Estimated depreciation: {depreciation}% from original MSRP.
                  </p>
                </div>

                <div className="w-full max-w-md">
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>Depreciated</span>
                    <span>Retained</span>
                  </div>

                  <div className="mt-3 h-4 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-lime-400"
                      style={{ width: `${valueRetained}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-zinc-500">0%</span>
                    <span className="font-medium text-lime-400">
                      {valueRetained}%
                    </span>
                    <span className="text-zinc-500">100%</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-400">
                  Deal Score
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Listing analysis coming soon
                </h2>

                <p className="mt-3 max-w-2xl text-zinc-400">
                  MTB Index will compare a seller’s asking price against the
                  estimated market value to flag great deals, fair prices, and
                  overpriced listings.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center">
                <p className="text-sm text-zinc-500">Status</p>
                <p className="mt-2 text-2xl font-bold text-lime-400">
                  Coming Soon
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-400">
              Pricing Methodology
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              How this estimate is calculated
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MethodCard
                title="Original MSRP"
                description="Uses the bike’s factory MSRP as the starting value."
              />

              <MethodCard
                title="Age Adjustment"
                description="Applies a simple depreciation curve based on model year."
              />

              <MethodCard
                title="Market Data Coming"
                description="Future versions will include real listings and comparable sales."
              />
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-400">
              Geometry
            </p>

            <h2 className="mt-2 text-3xl font-bold">Frame Geometry</h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {geometry.map((geo: any) => (
                <div
                  key={geo.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold">Size {geo.size}</h3>
                  </div>

                  <div className="space-y-2">
                    <GeometryRow label="Reach" value={`${geo.reach_mm} mm`} />
                    <GeometryRow label="Stack" value={`${geo.stack_mm} mm`} />
                    <GeometryRow
                      label="Wheelbase"
                      value={`${geo.wheelbase_mm} mm`}
                    />
                    <GeometryRow
                      label="Chainstay"
                      value={`${geo.chainstay_mm} mm`}
                    />
                    <GeometryRow
                      label="BB Drop"
                      value={`${geo.bb_drop_mm} mm`}
                    />
                    <GeometryRow
                      label="HT Angle"
                      value={`${geo.head_tube_angle}°`}
                    />
                    <GeometryRow
                      label="ST Angle"
                      value={`${geo.seat_tube_angle}°`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {geometryMatches.length > 0 && selectedGeometry && (
            <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-400">
                    Similar Bikes
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    Closest geometry matches
                  </h2>

                  <p className="mt-3 max-w-2xl text-zinc-400">
                    Showing bikes most similar to the {selectedGeometry.size}{" "}
                    size of this bike using actual geometry measurements.
                  </p>
                </div>
              </div>

              {geometry.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-sm text-zinc-400">Comparing size</p>

                  <div className="flex flex-wrap gap-2">
                    {geometry.map((geo: any) => (
                      <Link
                        key={geo.id}
                        href={`?size=${geo.size}`}
                        className={`rounded-full border px-4 py-2 text-sm ${
                          selectedGeometry?.size === geo.size
                            ? "border-lime-400 bg-lime-400 text-black"
                            : "border-zinc-700 text-zinc-300 hover:border-lime-400"
                        }`}
                      >
                        {geo.size}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {geometryMatches.map((match: any) => {
                  const matchBike = match.bike;
                  const matchBrand =
                    matchBike.bike_models?.brands?.name ?? "Unknown";
                  const matchModel = matchBike.bike_models?.name ?? "Unknown";

                  return (
                    <div
                      key={matchBike.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                    >
                      <p className="text-4xl font-black text-lime-400">
                        {match.score}% Match
                      </p>

                      <p className="mt-3 text-lg font-bold">
                        {matchBike.year} {matchBrand} {matchModel}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        Best matching size
                      </p>

                      <p className="mt-1 text-lg font-semibold text-white">
                        {match.geometry.size}
                      </p>

                      <div className="mt-5 space-y-2 border-t border-zinc-800 pt-4">
                        <DifferenceRow
                          label="Reach"
                          value={`${Math.round(match.differences.reach)} mm`}
                        />

                        <DifferenceRow
                          label="Stack"
                          value={`${Math.round(match.differences.stack)} mm`}
                        />

                        <DifferenceRow
                          label="Wheelbase"
                          value={`${Math.round(
                            match.differences.wheelbase
                          )} mm`}
                        />
                      </div>

                      <Link
                        href={`/compare?bike=${bike.id}&compare=${
                          matchBike.id
                        }&sizeA=${selectedGeometry.size}&sizeB=${
                          match.geometry.size
                        }`}
                        className="mt-5 flex rounded-xl border border-lime-400/40 px-4 py-3 text-sm font-semibold text-lime-400 transition hover:bg-lime-400 hover:text-black"
                      >
                        Compare Bikes →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
              <h2 className="text-2xl font-bold">Bike Details</h2>

              <div className="mt-6 space-y-3">
                <DetailRow label="Brand" value={brand} />
                <DetailRow label="Model" value={model} />
                <DetailRow label="Year" value={bike.year?.toString() ?? "--"} />
                <DetailRow label="Category" value={category} />
                <DetailRow
                  label="Front Travel"
                  value={`${bike.front_travel_mm ?? "--"} mm`}
                />
                <DetailRow
                  label="Rear Travel"
                  value={`${bike.rear_travel_mm ?? "--"} mm`}
                />
                <DetailRow
                  label="Wheel Size"
                  value={bike.wheel_size ? `${bike.wheel_size}` : "--"}
                />
                <DetailRow
                  label="Frame Material"
                  value={bike.frame_material ?? "--"}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
              <h2 className="text-2xl font-bold">Factory Build Specs</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Original equipment specification when new.
              </p>

              <div className="mt-6 space-y-4">
                {components.length > 0 ? (
                  components.map((item: any) => (
                    <ComponentRow
                      key={item.id}
                      role={item.component_role}
                      brand={item.components?.brand ?? ""}
                      name={item.components?.name ?? "Unknown component"}
                    />
                  ))
                ) : (
                  <p className="text-zinc-400">No components added yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 py-3">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ComponentRow({
  role,
  brand,
  name,
}: {
  role: string;
  brand: string;
  name: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-400">
        {role}
      </p>
      <p className="mt-2 text-lg font-bold">
        {brand} {name}
      </p>
    </div>
  );
}

function MethodCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}

function GeometryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 py-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function DifferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function ValueRow({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between border-b border-lime-400/10 pb-2 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-white">
        {value ? `$${value.toLocaleString()}` : "N/A"}
      </span>
    </div>
  );
}