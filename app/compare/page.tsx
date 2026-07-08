import React from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { supabase } from "../lib/supabase";
import {
  geometryMatchScore,
  geometryDifferences,
  rideDNA,
} from "../lib/geometrymatch";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{
    bike?: string;
    compare?: string;
    sizeA?: string;
    sizeB?: string;
  }>;
}) {
  const { bike: bikeAId, compare: bikeBId, sizeA, sizeB } = await searchParams;

  const { data: bikes } = await supabase
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
      )
    `)
    .order("year", { ascending: false });

  const { data: geometry } = await supabase.from("bike_geometry").select("*");

  const bikeA = bikes?.find((bike) => bike.id === bikeAId) ?? null;
  const bikeB = bikes?.find((bike) => bike.id === bikeBId) ?? null;

  const geometryA =
    geometry?.filter((geo) => geo.bike_version_id === bikeAId) ?? [];

  const geometryB =
    geometry?.filter((geo) => geo.bike_version_id === bikeBId) ?? [];

  const selectedSizeA =
    geometryA.find((geo) => geo.size === sizeA)?.size ??
    geometryA[0]?.size ??
    "";

  const selectedSizeB =
    geometryB.find((geo) => geo.size === sizeB)?.size ??
    geometryB[0]?.size ??
    "";

  const selectedGeoA =
    geometryA.find((geo) => geo.size === selectedSizeA) ?? null;

  const selectedGeoB =
    geometryB.find((geo) => geo.size === selectedSizeB) ?? null;

  const matchScore =
    selectedGeoA && selectedGeoB
      ? geometryMatchScore(selectedGeoA, selectedGeoB)
      : null;

  const geometryDiffs =
    selectedGeoA && selectedGeoB
      ? geometryDifferences(selectedGeoA, selectedGeoB)
      : null;

  const dna =
    selectedGeoA && selectedGeoB && bikeA && bikeB
      ? rideDNA(
          {
            ...selectedGeoA,
            front_travel_mm: bikeA.front_travel_mm,
            rear_travel_mm: bikeA.rear_travel_mm,
          },
          {
            ...selectedGeoB,
            front_travel_mm: bikeB.front_travel_mm,
            rear_travel_mm: bikeB.rear_travel_mm,
          }
        )
      : null;

  const bestMatchingSize =
    selectedGeoA && geometryB.length > 0
      ? geometryB
          .map((geo) => {
            const score = geometryMatchScore(selectedGeoA, geo);

            return {
              geometry: geo,
              size: geo.size,
              score,
              isCurrentlySelected: geo.size === selectedSizeB,
            };
          })
          .sort((a, b) => b.score - a.score)[0]
      : null;

  const selectedSizeBIsBest = bestMatchingSize?.size === selectedSizeB;

  const geometryVerdict =
    geometryDiffs && matchScore !== null
      ? getGeometryVerdict(geometryDiffs, matchScore)
      : null;

  const availableBikes =
    bikes?.filter((bike) => bike.id !== bikeAId && bike.id !== bikeBId) ?? [];

  const factoryBuildRows = [
    ["Fork", ["fork", "front fork", "suspension fork"]],
    ["Shock", ["shock", "rear shock"]],
    ["Drivetrain", ["drivetrain", "groupset"]],
    ["Brakes", ["brakes", "brake", "brake set"]],
    ["Wheels", ["wheelset", "wheels"]],
    ["Dropper", ["dropper", "dropper post", "seatpost"]],
    ["Handlebar", ["handlebar", "bar"]],
    ["Stem", ["stem"]],
    ["Crankset", ["crankset", "cranks"]],
    ["Cassette", ["cassette"]],
  ] as const;

  const comparisonSections = [
    {
      title: "Weight & Suspension",
      rows: [
        ["Weight", "claimed_weight_lbs", " lb", "lower", "bike"],
        ["Front Travel", "front_travel_mm", "mm", "higher", "bike"],
        ["Rear Travel", "rear_travel_mm", "mm", "higher", "bike"],
      ],
    },
    {
      title: "Bike Details",
      rows: [
        ["MSRP", "msrp", "", null, "bike"],
        ["Frame Material", "frame_material", "", null, "bike"],
        ["Wheel Size", "wheel_size", "", null, "bike"],
        ["Category", "category", "", null, "model"],
      ],
    },
    {
      title: "Fit",
      rows: [
        ["Reach", "reach_mm", "mm", null, "geo"],
        ["Stack", "stack_mm", "mm", null, "geo"],
        ["Effective Top Tube", "effective_top_tube_mm", "mm", null, "geo"],
        ["Seat Tube", "seat_tube_mm", "mm", null, "geo"],
        ["Standover", "standover_mm", "mm", null, "geo"],
      ],
    },
    {
      title: "Handling",
      rows: [
        ["Head Tube Angle", "head_tube_angle", "°", null, "geo"],
        ["Seat Tube Angle", "seat_tube_angle", "°", null, "geo"],
        ["Chainstay", "chainstay_mm", "mm", null, "geo"],
        ["Wheelbase", "wheelbase_mm", "mm", null, "geo"],
        ["BB Drop", "bb_drop_mm", "mm", null, "geo"],
        ["Head Tube", "head_tube_mm", "mm", null, "geo"],
      ],
    },
  ] as const;

  function formatBikeName(bike: any) {
    if (!bike) return "Select bike";

    return `${bike.year ?? ""} ${bike.bike_models?.brands?.name ?? ""} ${
      bike.bike_models?.name ?? ""
    }`.trim();
  }

  function formatValue(value: any, suffix = "") {
    if (value === null || value === undefined || value === "") return "—";

    if (suffix === "" && typeof value === "number" && value > 999) {
      return `$${value.toLocaleString()}`;
    }

    return `${value}${suffix}`;
  }

  function formatDifference(value: number | null, suffix = "mm") {
    if (value === null || value === undefined) return "—";

    const rounded = Math.round(value * 10) / 10;
    const sign = rounded > 0 ? "+" : "";

    return `${sign}${rounded}${suffix}`;
  }

  function getMatchLabel(score: number) {
    if (score >= 90) return "Excellent Match";
    if (score >= 80) return "Strong Match";
    if (score >= 70) return "Good Match";
    if (score >= 60) return "Moderate Match";
    return "Low Match";
  }

  function getWinnerClass(
    valueA: any,
    valueB: any,
    mode: "higher" | "lower"
  ) {
    if (
      valueA === null ||
      valueA === undefined ||
      valueA === "" ||
      valueB === null ||
      valueB === undefined ||
      valueB === ""
    ) {
      return ["", ""];
    }

    const a = Number(valueA);
    const b = Number(valueB);

    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) {
      return ["", ""];
    }

    if (mode === "higher") {
      return a > b
        ? ["text-orange-400 font-semibold", ""]
        : ["", "text-orange-400 font-semibold"];
    }

    return a < b
      ? ["text-orange-400 font-semibold", ""]
      : ["", "text-orange-400 font-semibold"];
  }

  function compareHref(params: {
    bike?: string | null;
    compare?: string | null;
    sizeA?: string | null;
    sizeB?: string | null;
  }) {
    const query = new URLSearchParams();

    if (params.bike) query.set("bike", params.bike);
    if (params.compare) query.set("compare", params.compare);
    if (params.sizeA) query.set("sizeA", params.sizeA);
    if (params.sizeB) query.set("sizeB", params.sizeB);

    return `/compare?${query.toString()}`;
  }

  function getComponentText(bike: any, roleOptions: readonly string[]) {
    const components = bike?.bike_version_components ?? [];

    const match = components.find((item: any) => {
      const role = String(item.component_role ?? "").toLowerCase().trim();

      return roleOptions.some((option) => role === option.toLowerCase());
    });

    if (!match) return "—";

    const brand = match.components?.brand ?? "";
    const name = match.components?.name ?? "";
    const notes = match.notes ?? "";

    const componentName = `${brand} ${name}`.trim();

    if (componentName && notes) return `${componentName} — ${notes}`;
    if (componentName) return componentName;
    if (notes) return notes;

    return "—";
  }

  function getBikeDetailValue(bike: any, key: string) {
    if (!bike) return null;

    if (key === "category") {
      return bike.bike_models?.category ?? null;
    }

    return bike[key];
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-orange-400"
            >
              ← Back to bikes
            </Link>

            <h1 className="mt-4 text-4xl font-bold">Compare Bikes</h1>
            <p className="mt-2 text-zinc-400">
              Compare specs, geometry, factory builds, weight, and value side by
              side.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[bikeA, bikeB].map((bike, index) => {
              const isBikeA = index === 0;
              const bikeGeometry = isBikeA ? geometryA : geometryB;
              const selectedSize = isBikeA ? selectedSizeA : selectedSizeB;

              return (
                <div
                  key={isBikeA ? "bike-a" : "bike-b"}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
                >
                  <p className="text-sm uppercase tracking-wide text-zinc-500">
                    {isBikeA ? "Bike A" : "Bike B"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {formatBikeName(bike)}
                  </h2>

                  <div className="mt-4">
                    <p className="mb-2 text-sm text-zinc-400">Size</p>

                    <div className="flex flex-wrap gap-2">
                      {bikeGeometry.length > 0 ? (
                        bikeGeometry.map((geo) => (
                          <Link
                            key={geo.id}
                            href={compareHref({
                              bike: bikeAId,
                              compare: bikeBId,
                              sizeA: isBikeA ? geo.size : selectedSizeA,
                              sizeB: isBikeA ? selectedSizeB : geo.size,
                            })}
                            className={`rounded-full border px-4 py-2 text-sm ${
                              selectedSize === geo.size
                                ? "border-orange-500 bg-orange-500 text-white"
                                : "border-zinc-700 text-zinc-300 hover:border-orange-400"
                            }`}
                          >
                            {geo.size}
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">
                          No geometry sizes added yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-zinc-950 p-4">
                    <p className="text-sm text-zinc-500">Claimed Weight</p>
                    <p className="mt-1 text-2xl font-bold">
                      {formatValue(bike?.claimed_weight_lbs, " lb")}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {bike?.claimed_weight_note ?? "Weight note not added."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {matchScore !== null && geometryDiffs && (
            <section className="mt-8 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-7">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
                    Geometry Match
                  </p>

                  <h2
                    className={`mt-3 text-6xl font-black ${getScoreClass(
                      matchScore
                    )}`}
                  >
                    {matchScore}%
                  </h2>

                  <p className="mt-3 text-xl font-semibold">
                    {getMatchLabel(matchScore)}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {formatBikeName(bikeA)} size {selectedSizeA || "—"} vs{" "}
                    {formatBikeName(bikeB)} size {selectedSizeB || "—"}. Score
                    is based on actual geometry measurements.
                  </p>

                  {geometryVerdict && (
                    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
                        Ride Impression
                      </p>

                      <p className="mt-3 text-lg leading-8 text-zinc-200">
                        {geometryVerdict}
                      </p>
                    </div>
                  )}

                  {bestMatchingSize && (
                    <div className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
                        Smart Size Match
                      </p>

                      <p className="mt-2 text-4xl font-black text-white">
                        {bestMatchingSize.size}
                      </p>

                      <p
                        className={`mt-2 text-2xl font-bold ${getScoreClass(
                          bestMatchingSize.score
                        )}`}
                      >
                        {bestMatchingSize.score}% Match
                      </p>

                      <p className="mt-3 text-sm text-zinc-400">
                        Closest equivalent to your{" "}
                        <span className="font-semibold text-white">
                          {selectedSizeA || "—"}
                        </span>{" "}
                        on the {formatBikeName(bikeA)}.
                      </p>

                      {!selectedSizeBIsBest && (
                        <Link
                          href={compareHref({
                            bike: bikeAId,
                            compare: bikeBId,
                            sizeA: selectedSizeA,
                            sizeB: bestMatchingSize.size,
                          })}
                          className="mt-4 inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                          Switch to best size
                        </Link>
                      )}

                      {selectedSizeBIsBest && (
                        <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
                          <span className="text-lg">✓</span>

                          <div>
                            <p className="text-sm font-semibold text-green-400">
                              Recommended Size Selected
                            </p>

                            <p className="text-xs text-zinc-400">
                              You're already comparing the closest matching
                              size.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MatchDifference
                    label="Reach"
                    value={formatDifference(geometryDiffs.reach)}
                    description={describeDifference(
                      geometryDiffs.reach,
                      "longer",
                      "shorter"
                    )}
                  />
                  <MatchDifference
                    label="Stack"
                    value={formatDifference(geometryDiffs.stack)}
                    description={describeDifference(
                      geometryDiffs.stack,
                      "taller",
                      "lower"
                    )}
                  />
                  <MatchDifference
                    label="Wheelbase"
                    value={formatDifference(geometryDiffs.wheelbase)}
                    description={describeDifference(
                      geometryDiffs.wheelbase,
                      "more stable",
                      "more playful"
                    )}
                  />
                  <MatchDifference
                    label="Chainstay"
                    value={formatDifference(geometryDiffs.chainstay)}
                    description={describeDifference(
                      geometryDiffs.chainstay,
                      "longer rear end",
                      "shorter rear end"
                    )}
                  />
                  <MatchDifference
                    label="BB Drop"
                    value={formatDifference(geometryDiffs.bbDrop)}
                    description={describeDifference(
                      geometryDiffs.bbDrop,
                      "lower bottom bracket",
                      "higher bottom bracket"
                    )}
                  />
                  <MatchDifference
                    label="Head Angle"
                    value={formatDifference(geometryDiffs.headAngle, "°")}
                    description={describeDifference(
                      geometryDiffs.headAngle,
                      "steeper",
                      "slacker"
                    )}
                  />
                  <MatchDifference
                    label="Seat Angle"
                    value={formatDifference(geometryDiffs.seatAngle, "°")}
                    description={describeDifference(
                      geometryDiffs.seatAngle,
                      "steeper climbing position",
                      "slacker climbing position"
                    )}
                  />
                </div>
              </div>

              {dna && (
                <>
                  <div className="mt-8 border-t border-zinc-800 pt-6">
                    <h3 className="text-lg font-semibold text-white">
                      Ride DNA
                    </h3>

                    <p className="mt-2 text-sm text-zinc-400">
                      These scores break the overall Geometry Match into fit,
                      handling, and suspension similarity.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <RideDNACard label="Overall" value={matchScore} />
                    <RideDNACard label="Fit" value={dna.fit} />
                    <RideDNACard label="Handling" value={dna.handling} />
                    <RideDNACard label="Suspension" value={dna.suspension} />
                  </div>
                </>
              )}
            </section>
          )}

          <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 p-5">
              <h2 className="text-2xl font-semibold">
                Full Bike Comparison
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Factory build, weight, suspension, frame details, and geometry
                in one table.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">Spec</th>
                    <th className="px-5 py-3">{formatBikeName(bikeA)}</th>
                    <th className="px-5 py-3">{formatBikeName(bikeB)}</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-t border-zinc-800">
                    <td className="px-5 py-3 text-zinc-400">Selected Size</td>
                    <td className="px-5 py-3">{selectedSizeA || "—"}</td>
                    <td className="px-5 py-3">{selectedSizeB || "—"}</td>
                  </tr>

                  <tr className="border-t border-zinc-800 bg-zinc-950">
                    <td
                      colSpan={3}
                      className="px-5 py-3 text-xs font-bold uppercase tracking-[0.25em] text-orange-400"
                    >
                      Factory Build Components
                    </td>
                  </tr>

                  {factoryBuildRows.map(([label, roles]) => (
                    <tr key={label} className="border-t border-zinc-800">
                      <td className="px-5 py-3 text-zinc-400">{label}</td>
                      <td className="px-5 py-3">
                        {getComponentText(bikeA, roles)}
                      </td>
                      <td className="px-5 py-3">
                        {getComponentText(bikeB, roles)}
                      </td>
                    </tr>
                  ))}

                  {comparisonSections.map((section) => (
                    <React.Fragment key={section.title}>
                      <tr className="border-t border-zinc-800 bg-zinc-950">
                        <td
                          colSpan={3}
                          className="px-5 py-3 text-xs font-bold uppercase tracking-[0.25em] text-orange-400"
                        >
                          {section.title}
                        </td>
                      </tr>

                      {section.rows.map(([label, key, suffix, mode, source]) => {
                        const valueA =
                          source === "bike"
                            ? bikeA?.[key]
                            : source === "model"
                            ? getBikeDetailValue(bikeA, key)
                            : selectedGeoA?.[key];

                        const valueB =
                          source === "bike"
                            ? bikeB?.[key]
                            : source === "model"
                            ? getBikeDetailValue(bikeB, key)
                            : selectedGeoB?.[key];

                        const [classA, classB] = mode
                          ? getWinnerClass(valueA, valueB, mode)
                          : ["", ""];

                        return (
                          <tr key={key} className="border-t border-zinc-800">
                            <td className="px-5 py-3 text-zinc-400">
                              {label}
                            </td>
                            <td className={`px-5 py-3 ${classA}`}>
                              {formatValue(valueA, suffix)}
                            </td>
                            <td className={`px-5 py-3 ${classB}`}>
                              {formatValue(valueB, suffix)}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">Add another bike</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {availableBikes.map((bike) => (
                <Link
                  key={bike.id}
                  href={compareHref({
                    bike: bikeAId ?? bike.id,
                    compare: bikeAId ? bike.id : bikeBId,
                    sizeA: selectedSizeA,
                    sizeB: selectedSizeB,
                  })}
                  className="rounded-xl border border-zinc-800 p-4 hover:border-orange-500"
                >
                  {formatBikeName(bike)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function MatchDifference({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}

function RideDNACard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const scoreClass = getScoreClass(value);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className={`mt-2 text-4xl font-bold ${scoreClass}`}>
        {value !== null ? `${value}%` : "—"}
      </p>
    </div>
  );
}

function getScoreClass(value: number | null) {
  if (value === null) return "text-zinc-500";
  if (value >= 90) return "text-green-400";
  if (value >= 80) return "text-lime-400";
  if (value >= 70) return "text-yellow-400";
  if (value >= 60) return "text-orange-400";
  return "text-red-400";
}

function describeDifference(
  value: number | null,
  positiveLabel: string,
  negativeLabel: string
) {
  if (value === null) return undefined;

  const absValue = Math.abs(value);

  if (absValue < 0.1) return "Nearly identical";

  return value > 0 ? `Bike B is ${positiveLabel}` : `Bike B is ${negativeLabel}`;
}

function getGeometryVerdict(diffs: any, matchScore: number) {
  if (matchScore >= 90) {
    return "These bikes are very close geometrically. Expect a familiar fit and ride feel, with only small handling differences.";
  }

  if (diffs.wheelbase !== null && diffs.wheelbase > 20) {
    return "Bike B should feel more stable at speed thanks to its longer wheelbase.";
  }

  if (diffs.wheelbase !== null && diffs.wheelbase < -20) {
    return "Bike B should feel more playful and easier to maneuver thanks to its shorter wheelbase.";
  }

  if (diffs.headAngle !== null && diffs.headAngle < -0.5) {
    return "Bike B has a slacker front end, which should feel more confident on steep descents.";
  }

  if (diffs.reach !== null && diffs.reach > 15) {
    return "Bike B has a longer cockpit, so it may feel roomier and more stretched out.";
  }

  if (diffs.reach !== null && diffs.reach < -15) {
    return "Bike B has a shorter cockpit, so it may feel more compact and easier to move around on.";
  }

  return "These bikes have some noticeable geometry differences, but they are still close enough to compare directly.";
}