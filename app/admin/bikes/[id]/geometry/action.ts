"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../../../../lib/supabase";

function numberOrNull(value: FormDataEntryValue | null) {
  if (!value || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function updateGeometry(
  geometryId: string,
  bikeId: string,
  formData: FormData
) {
  const { error } = await supabase
    .from("bike_geometry")
    .update({
      reach_mm: numberOrNull(formData.get("reach_mm")),
      stack_mm: numberOrNull(formData.get("stack_mm")),
      wheelbase_mm: numberOrNull(formData.get("wheelbase_mm")),
      chainstay_mm: numberOrNull(formData.get("chainstay_mm")),
      head_tube_angle: numberOrNull(formData.get("head_tube_angle")),
      seat_tube_angle: numberOrNull(formData.get("seat_tube_angle")),
    })
    .eq("id", geometryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/bikes/${bikeId}/geometry`);
}

export async function createGeometryRow(bikeId: string, formData: FormData) {
  const size = String(formData.get("size") ?? "").trim();

  if (!size) {
    throw new Error("Size is required.");
  }

  const { error } = await supabase.from("bike_geometry").insert({
    bike_version_id: bikeId,
    size,
    reach_mm: numberOrNull(formData.get("reach_mm")),
    stack_mm: numberOrNull(formData.get("stack_mm")),
    wheelbase_mm: numberOrNull(formData.get("wheelbase_mm")),
    chainstay_mm: numberOrNull(formData.get("chainstay_mm")),
    head_tube_angle: numberOrNull(formData.get("head_tube_angle")),
    seat_tube_angle: numberOrNull(formData.get("seat_tube_angle")),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/bikes/${bikeId}/geometry`);
}