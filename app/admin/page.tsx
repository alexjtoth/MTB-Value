import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { supabase } from "../lib/supabase";

export default async function AdminPage() {
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
      )
    `)
    .order("year", { ascending: false });

  const totalBikes = bikes?.length ?? 0;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
                Admin
              </p>

              <h1 className="mt-3 text-4xl font-bold">MTB Index Admin</h1>

              <p className="mt-2 text-zinc-400">
                Manage bikes, geometry, components, images, and market data.
              </p>
            </div>

            <Link
              href="/admin/bikes/new"
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              + Add Bike
            </Link>
          </div>

          <section className="grid gap-4 md:grid-cols-4">
            <AdminStat label="Total Bikes" value={totalBikes.toString()} />
            <AdminStat label="Brands" value="Coming" />
            <AdminStat label="Geometry Rows" value="Coming" />
            <AdminStat label="Listings" value="Coming" />
          </section>

          <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 p-5">
              <h2 className="text-2xl font-bold">Bike Database</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Current bike versions in your database.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">Bike</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Year</th>
                    <th className="px-5 py-3">MSRP</th>
                    <th className="px-5 py-3">Travel</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {bikes && bikes.length > 0 ? (
                    bikes.map((bike: any) => (
                      <tr key={bike.id} className="border-t border-zinc-800">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">
                            {bike.bike_models?.brands?.name ?? "Unknown"}{" "}
                            {bike.bike_models?.name ?? ""}
                          </p>
                          <p className="text-xs text-zinc-500">{bike.id}</p>
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {bike.bike_models?.category ?? "—"}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {bike.year ?? "—"}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {bike.msrp
                            ? `$${Number(bike.msrp).toLocaleString()}`
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {bike.front_travel_mm ?? "—"}/
                          {bike.rear_travel_mm ?? "—"} mm
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-3">
                            <Link
                              href={`/bikes/${bike.id}`}
                              className="text-sm font-semibold text-lime-400 hover:text-lime-300"
                            >
                              View
                            </Link>

                            <Link
                              href={`/admin/bikes/${bike.id}`}
                              className="text-sm font-semibold text-orange-400 hover:text-orange-300"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-zinc-500"
                      >
                        No bikes found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}