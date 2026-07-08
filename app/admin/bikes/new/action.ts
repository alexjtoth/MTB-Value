"use server";

import { redirect } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function numberOrNull(value: FormDataEntryValue | null) {
  if (!value || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function createBike(formData: FormData) {
  const brandName = String(formData.get("brand") ?? "").trim();
  const modelName = String(formData.get("model") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  const year = numberOrNull(formData.get("year"));
  const msrp = numberOrNull(formData.get("msrp"));
  const claimedWeight = numberOrNull(formData.get("claimed_weight_lbs"));
  const frontTravel = numberOrNull(formData.get("front_travel_mm"));
  const rearTravel = numberOrNull(formData.get("rear_travel_mm"));

  const wheelSize = String(formData.get("wheel_size") ?? "").trim();
  const frameMaterial = String(formData.get("frame_material") ?? "").trim();

  if (!brandName || !modelName || !year) {
    throw new Error("Brand, model, and year are required.");
  }

  const brandSlug = slugify(brandName);
  const modelSlug = slugify(`${brandName}-${modelName}`);

  let { data: brand, error: existingBrandError } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", brandSlug)
    .maybeSingle();

  if (existingBrandError) {
    throw new Error(existingBrandError.message);
  }

  if (!brand) {
    const { data: newBrand, error: brandError } = await supabase
      .from("brands")
      .insert({
        name: brandName,
        slug: brandSlug,
      })
      .select()
      .single();

    if (brandError || !newBrand) {
      throw new Error(brandError?.message ?? "Could not create brand.");
    }

    brand = newBrand;
  }

  let { data: model, error: existingModelError } = await supabase
    .from("bike_models")
    .select("*")
    .eq("slug", modelSlug)
    .maybeSingle();

  if (existingModelError) {
    throw new Error(existingModelError.message);
  }

  if (!model) {
    const { data: newModel, error: modelError } = await supabase
      .from("bike_models")
      .insert({
        brand_id: brand.id,
        name: modelName,
        slug: modelSlug,
        category,
      })
      .select()
      .single();

    if (modelError || !newModel) {
      throw new Error(modelError?.message ?? "Could not create bike model.");
    }

    model = newModel;
  }

  const { error: bikeError } = await supabase.from("bike_versions").insert({
    bike_model_id: model.id,
    year,
    msrp,
    claimed_weight_lbs: claimedWeight,
    front_travel_mm: frontTravel,
    rear_travel_mm: rearTravel,
    wheel_size: wheelSize || null,
    frame_material: frameMaterial || null,
  });

  if (bikeError) {
    throw new Error(bikeError.message);
  }

  redirect("/admin");
}