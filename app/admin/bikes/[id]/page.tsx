import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";
import { updateBike } from "./action";

export default async function EditBikePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: bike, error } = await supabase
    .from("bike_versions")
    .select(`
      *,
      bike_models (
        name,
        category,
        brands (
          name
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !bike) {
    notFound();
  }

  const updateBikeWithId = updateBike.bind(null, id);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/admin"
            className="text-sm text-zinc-400 hover:text-orange-400"
          >
            ← Back to Admin
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold">Edit Bike</h1>

            <p className="mt-2 text-zinc-400">
              {bike.year} {bike.bike_models?.brands?.name}{" "}
              {bike.bike_models?.name}
            </p>
          </div>

          <form action={updateBikeWithId} className="mt-10 space-y-8">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-6 text-2xl font-bold">Bike Details</h2>

              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  name="year"
                  label="Year"
                  defaultValue={bike.year}
                  type="number"
                />

                <Input
                  name="msrp"
                  label="MSRP"
                  defaultValue={bike.msrp}
                  type="number"
                />

                <Input
                  name="claimed_weight_lbs"
                  label="Claimed Weight"
                  defaultValue={bike.claimed_weight_lbs}
                  type="number"
                />

                <Input
                  name="front_travel_mm"
                  label="Front Travel"
                  defaultValue={bike.front_travel_mm}
                  type="number"
                />

                <Input
                  name="rear_travel_mm"
                  label="Rear Travel"
                  defaultValue={bike.rear_travel_mm}
                  type="number"
                />

                <Input
                  name="wheel_size"
                  label="Wheel Size"
                  defaultValue={bike.wheel_size}
                />

                <Input
                  name="frame_material"
                  label="Frame Material"
                  defaultValue={bike.frame_material}
                />

                <Input
                  name="image_url"
                  label="Image URL"
                  defaultValue={bike.image_url}
                />
              </div>
            </section>

           <div className="flex justify-between">
  <Link
    href={`/admin/bikes/${id}/geometry`}
    className="rounded-xl border border-orange-500 px-5 py-3 font-semibold text-orange-400 hover:bg-orange-500 hover:text-white"
  >
    Edit Geometry
  </Link>

  <div className="flex gap-4">
    <Link
      href="/admin"
      className="rounded-xl border border-zinc-700 px-5 py-3 text-zinc-300 hover:border-zinc-500"
    >
      Cancel
    </Link>

    <button
      type="submit"
      className="rounded-xl bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600"
    >
      Save Changes
    </button>
  </div>
</div>
          </form>
        </div>
      </main>
    </>
  );
}

function Input({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: any;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-orange-500"
      />
    </div>
  );
}