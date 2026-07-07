const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function slugify(text) {
  return text.toLowerCase().trim().replaceAll(" ", "-");
}

async function upsertBrand(brand) {
  const slug = slugify(brand.name);

  const { data, error } = await supabase
    .from("brands")
    .upsert(
      {
        name: brand.name,
        slug,
        country: brand.country ?? null,
        website_url: brand.website_url ?? null,
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function upsertModel(model, brandId) {
  const slug = model.slug || slugify(model.name);

  const { data, error } = await supabase
    .from("bike_models")
    .upsert(
      {
        brand_id: brandId,
        name: model.name,
        slug,
        category: model.category ?? null,
        description: model.description ?? null,
        introduced_year: model.introduced_year ?? null,
        discontinued_year: model.discontinued_year ?? null,
      },
      { onConflict: "brand_id,slug" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function upsertVersion(version, bikeModelId) {
  const { data, error } = await supabase
    .from("bike_versions")
    .upsert(
      {
        bike_model_id: bikeModelId,
        year: version.year,
        msrp: version.msrp ?? null,
        frame_material: version.frame_material ?? null,
        wheel_size: version.wheel_size ?? null,
        front_travel_mm: version.front_travel_mm ?? null,
        rear_travel_mm: version.rear_travel_mm ?? null,
        image_url: version.image_url ?? null,
      },
      { onConflict: "bike_model_id,year" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function importFile(fileName) {
  const filePath = path.join(__dirname, "..", "imports", fileName);
  const catalog = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const brand = await upsertBrand(catalog.brand);
  console.log(`Brand imported: ${brand.name}`);

  for (const modelInput of catalog.models) {
    const model = await upsertModel(modelInput, brand.id);
    console.log(`Model imported: ${brand.name} ${model.name}`);

    for (const versionInput of modelInput.versions) {
      const version = await upsertVersion(versionInput, model.id);
      console.log(
        `Version imported: ${version.year} ${brand.name} ${model.name}`
      );
    }
  }
}

async function main() {
  const fileName = process.argv[2];

  if (fileName) {
    await importFile(fileName);
    console.log("Import complete.");
    return;
  }

  const importsDir = path.join(__dirname, "..", "imports");

  const jsonFiles = fs
    .readdirSync(importsDir)
    .filter((file) => file.endsWith(".json"));

  if (jsonFiles.length === 0) {
    throw new Error("No JSON files found in imports folder.");
  }

  for (const jsonFile of jsonFiles) {
    console.log(`\nImporting ${jsonFile}...`);
    await importFile(jsonFile);
  }

  console.log("\nAll imports complete.");
}

main().catch((error) => {
  console.error("Import failed:", error);
});