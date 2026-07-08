import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { createBike } from "./action";

export default function NewBikePage() {
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

            <h1 className="mt-3 text-4xl font-bold">Add New Bike</h1>

            <p className="mt-2 text-zinc-400">
              Create a new bike version in MTB Index.
            </p>
          </div>

          <form action={createBike} className="mt-10 space-y-8">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-6 text-2xl font-bold">Basic Information</h2>

              <div className="grid gap-6 md:grid-cols-2">
                <Input name="brand" label="Brand" placeholder="Propain" />
                <Input name="model" label="Model" placeholder="Tyee" />
                <Input
                  name="year"
                  label="Year"
                  placeholder="2024"
                  type="number"
                />
                <Input name="category" label="Category" placeholder="Enduro" />
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-6 text-2xl font-bold">Specifications</h2>

              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  name="msrp"
                  label="MSRP"
                  placeholder="5699"
                  type="number"
                />
                <Input
                  name="claimed_weight_lbs"
                  label="Weight (lbs)"
                  placeholder="35.2"
                  type="number"
                />
                <Input
                  name="front_travel_mm"
                  label="Front Travel (mm)"
                  placeholder="170"
                  type="number"
                />
                <Input
                  name="rear_travel_mm"
                  label="Rear Travel (mm)"
                  placeholder="160"
                  type="number"
                />
                <Input name="wheel_size" label="Wheel Size" placeholder="29" />
                <Input
                  name="frame_material"
                  label="Frame Material"
                  placeholder="Carbon"
                />
              </div>
            </section>

            <div className="flex justify-end gap-4">
              <Link
                href="/admin"
                className="rounded-xl border border-zinc-700 px-5 py-3 hover:border-zinc-500"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="rounded-xl bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600"
              >
                Save Bike
              </button>
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
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder: string;
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
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-orange-500"
      />
    </div>
  );
}