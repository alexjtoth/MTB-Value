"use server";

import { redirect } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function numberOrNull(value: FormDataEntryValue | null) {
  if (!value || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function updateBike(id: string, formData: FormData) {
  const year = numberOrNull(formData.get("year"));
  const msrp = numberOrNull(formData.get("msrp"));
  const claimedWeight = numberOrNull(formData.get("claimed_weight_lbs"));
  const frontTravel = numberOrNull(formData.get("front_travel_mm"));
  const rearTravel = numberOrNull(formData.get("rear_travel_mm"));

  const wheelSize = String(formData.get("wheel_size") ?? "").trim();
  const frameMaterial = String(formData.get("frame_material") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  const { error } = await supabase
    .from("bike_versions")
    .update({
      year,
      msrp,
      claimed_weight_lbs: claimedWeight,
      front_travel_mm: frontTravel,
      rear_travel_mm: rearTravel,
      wheel_size: wheelSize || null,
      frame_material: frameMaterial || null,
      image_url: imageUrl || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin");
}

export async function deleteBike(id: string) {
  const { error } = await supabase
    .from("bike_versions")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin");
}