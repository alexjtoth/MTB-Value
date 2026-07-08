import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "../../../../components/Navbar";
import { supabase } from "../../../../lib/supabase";
import { updateGeometry, createGeometryRow } from "./action";

export default async function GeometryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const createGeometry = createGeometryRow.bind(null, id);

  const { data: bike } = await supabase
    .from("bike_versions")
    .select(`
      *,
      bike_models (
        name,
        brands (
          name
        )
      )
    `)
    .eq("id", id)
    .single();

  if (!bike) {
    notFound();
  }

  const { data: geometry } = await supabase
    .from("bike_geometry")
    .select("*")
    .eq("bike_version_id", id)
    .order("size");

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/admin/bikes/${id}`}
            className="text-sm text-zinc-400 hover:text-orange-400"
          >
            ← Back to Bike
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
              Geometry
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              {bike.year} {bike.bike_models?.brands?.name}{" "}
              {bike.bike_models?.name}
            </h1>

            <p className="mt-2 text-zinc-400">
              Edit geometry by frame size.
            </p>
          </div>

          <section className="mt-8 overflow-hidden rounded-2xl border border-orange-500/30 bg-zinc-900">
            <div className="border-b border-zinc-800 p-5">
              <h2 className="text-xl font-bold">+ Add Size</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Add a new geometry row for this bike.
              </p>
            </div>

            <form action={createGeometry} className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Reach</th>
                    <th className="px-4 py-3">Stack</th>
                    <th className="px-4 py-3">Wheelbase</th>
                    <th className="px-4 py-3">Chainstay</th>
                    <th className="px-4 py-3">Head Angle</th>
                    <th className="px-4 py-3">Seat Angle</th>
                    <th className="px-4 py-3 text-right">Create</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="px-4 py-4">
                      <TextInput name="size" placeholder="XL" />
                    </td>

                    <td className="px-4 py-4">
                      <TableInput name="reach_mm" defaultValue="" />
                    </td>

                    <td className="px-4 py-4">
                      <TableInput name="stack_mm" defaultValue="" />
                    </td>

                    <td className="px-4 py-4">
                      <TableInput name="wheelbase_mm" defaultValue="" />
                    </td>

                    <td className="px-4 py-4">
                      <TableInput name="chainstay_mm" defaultValue="" />
                    </td>

                    <td className="px-4 py-4">
                      <TableInput name="head_tube_angle" defaultValue="" />
                    </td>

                    <td className="px-4 py-4">
                      <TableInput name="seat_tube_angle" defaultValue="" />
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        type="submit"
                        className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                      >
                        Create
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </form>
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 p-5">
              <h2 className="text-xl font-bold">Existing Geometry</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Reach</th>
                    <th className="px-4 py-3">Stack</th>
                    <th className="px-4 py-3">Wheelbase</th>
                    <th className="px-4 py-3">Chainstay</th>
                    <th className="px-4 py-3">Head Angle</th>
                    <th className="px-4 py-3">Seat Angle</th>
                    <th className="px-4 py-3 text-right">Save</th>
                  </tr>
                </thead>

                <tbody>
                  {geometry && geometry.length > 0 ? (
                    geometry.map((row) => {
                      const saveGeometry = updateGeometry.bind(null, row.id, id);

                      return (
                        <tr key={row.id} className="border-t border-zinc-800">
                          <td className="px-4 py-3 font-bold text-white">
                            {row.size}
                          </td>

                          <td className="px-4 py-3">
                            <form id={`geo-${row.id}`} action={saveGeometry} />
                            <TableInput
                              form={`geo-${row.id}`}
                              name="reach_mm"
                              defaultValue={row.reach_mm}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <TableInput
                              form={`geo-${row.id}`}
                              name="stack_mm"
                              defaultValue={row.stack_mm}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <TableInput
                              form={`geo-${row.id}`}
                              name="wheelbase_mm"
                              defaultValue={row.wheelbase_mm}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <TableInput
                              form={`geo-${row.id}`}
                              name="chainstay_mm"
                              defaultValue={row.chainstay_mm}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <TableInput
                              form={`geo-${row.id}`}
                              name="head_tube_angle"
                              defaultValue={row.head_tube_angle}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <TableInput
                              form={`geo-${row.id}`}
                              name="seat_tube_angle"
                              defaultValue={row.seat_tube_angle}
                            />
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              type="submit"
                              form={`geo-${row.id}`}
                              className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-zinc-500"
                      >
                        No geometry rows found for this bike.
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

function TableInput({
  form,
  name,
  defaultValue,
}: {
  form?: string;
  name: string;
  defaultValue: any;
}) {
  return (
    <input
      form={form}
      name={name}
      type="number"
      step="any"
      defaultValue={defaultValue ?? ""}
      className="w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-orange-500"
    />
  );
}

function TextInput({
  name,
  placeholder,
}: {
  name: string;
  placeholder: string;
}) {
  return (
    <input
      name={name}
      type="text"
      placeholder={placeholder}
      className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-orange-500"
    />
  );
}