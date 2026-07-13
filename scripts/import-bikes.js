const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// ============================================================
// SUPABASE SETUP
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Prefer a service-role key for imports if one exists.
// Fall back to the anon key so your current setup still works.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL in your .env.local file."
  );
}

if (!supabaseKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ============================================================
// HELPERS
// ============================================================

function slugify(value) {
  if (!value || typeof value !== "string") {
    throw new Error("slugify received an invalid value.");
  }

  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value).trim();

  return cleaned.length > 0 ? cleaned : null;
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function normalizeInteger(value) {
  const number = normalizeNumber(value);

  return number === null ? null : Math.round(number);
}

function normalizeTrimName(value) {
  const trimName = normalizeText(value);

  // Empty trim names are stored as an empty string.
  // This works with the database uniqueness rule.
  return trimName ?? "";
}

function getImportsDirectory() {
  return path.join(__dirname, "..", "imports");
}

function getImportFilePath(fileName) {
  if (!fileName) {
    throw new Error("No import file name was provided.");
  }

  const importsDirectory = getImportsDirectory();
  const filePath = path.resolve(importsDirectory, fileName);

  if (!filePath.startsWith(path.resolve(importsDirectory))) {
    throw new Error("Import file must be inside the imports folder.");
  }

  return filePath;
}

function readJsonFile(fileName) {
  const filePath = getImportFilePath(fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Import file not found: ${filePath}`);
  }

  let fileContents;

  try {
    fileContents = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Could not read ${fileName}: ${error.message}`);
  }

  try {
    return JSON.parse(fileContents);
  } catch (error) {
    throw new Error(`Invalid JSON in ${fileName}: ${error.message}`);
  }
}

function validateCatalog(catalog, fileName) {
  if (!catalog || typeof catalog !== "object") {
    throw new Error(`${fileName} does not contain a valid catalog object.`);
  }

  if (!catalog.brand || typeof catalog.brand !== "object") {
    throw new Error(`${fileName} is missing a brand object.`);
  }

  if (!catalog.brand.name) {
    throw new Error(`${fileName} is missing brand.name.`);
  }

  if (!Array.isArray(catalog.models)) {
    throw new Error(`${fileName} must contain a models array.`);
  }

  for (const model of catalog.models) {
    if (!model.name) {
      throw new Error(
        `${fileName} contains a model without a name.`
      );
    }

    if (!Array.isArray(model.versions)) {
      throw new Error(
        `${fileName}: ${model.name} must contain a versions array.`
      );
    }

    for (const version of model.versions) {
      if (!version.year) {
        throw new Error(
          `${fileName}: ${model.name} contains a version without a year.`
        );
      }
    }
  }
}

// ============================================================
// IMPORT BATCH TRACKING
// ============================================================

async function createImportBatch(fileName, catalog) {
  const sourceName =
    normalizeText(catalog.source_name) ||
    normalizeText(catalog.brand?.name) ||
    "JSON Import";

  const totalVersions = catalog.models.reduce((total, model) => {
    return total + model.versions.length;
  }, 0);

  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      source_name: sourceName,
      source_url: normalizeText(catalog.source_url),
      file_name: fileName,
      status: "processing",
      rows_received: totalVersions,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // This allows the importer to keep working if the new
    // import_batches table has not been created yet.
    console.warn(
      `Import tracking unavailable: ${error.message}`
    );

    return null;
  }

  return data;
}

async function completeImportBatch(importBatchId, counters) {
  if (!importBatchId) {
    return;
  }

  const { error } = await supabase
    .from("import_batches")
    .update({
      status: "completed",
      rows_imported: counters.imported,
      rows_updated: counters.updated,
      rows_failed: counters.failed,
      completed_at: new Date().toISOString(),
    })
    .eq("id", importBatchId);

  if (error) {
    console.warn(
      `Could not complete import batch tracking: ${error.message}`
    );
  }
}

async function failImportBatch(importBatchId, errorMessage, counters) {
  if (!importBatchId) {
    return;
  }

  const { error } = await supabase
    .from("import_batches")
    .update({
      status: "failed",
      rows_imported: counters.imported,
      rows_updated: counters.updated,
      rows_failed: counters.failed,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", importBatchId);

  if (error) {
    console.warn(
      `Could not mark import batch as failed: ${error.message}`
    );
  }
}

// ============================================================
// RAW IMPORT STORAGE
// ============================================================

async function saveRawImport({
  importBatchId,
  sourceName,
  sourceRecordId,
  rawData,
}) {
  if (!importBatchId) {
    return null;
  }

  const { data, error } = await supabase
    .from("raw_bike_imports")
    .insert({
      import_batch_id: importBatchId,
      source_name: sourceName,
      source_record_id: sourceRecordId,
      raw_data: rawData,
      processing_status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.warn(
      `Could not store raw import row: ${error.message}`
    );

    return null;
  }

  return data;
}

async function markRawImportProcessed(rawImportId) {
  if (!rawImportId) {
    return;
  }

  const { error } = await supabase
    .from("raw_bike_imports")
    .update({
      processing_status: "processed",
      processed_at: new Date().toISOString(),
      processing_error: null,
    })
    .eq("id", rawImportId);

  if (error) {
    console.warn(
      `Could not mark raw import as processed: ${error.message}`
    );
  }
}

async function markRawImportFailed(rawImportId, errorMessage) {
  if (!rawImportId) {
    return;
  }

  const { error } = await supabase
    .from("raw_bike_imports")
    .update({
      processing_status: "failed",
      processed_at: new Date().toISOString(),
      processing_error: errorMessage,
    })
    .eq("id", rawImportId);

  if (error) {
    console.warn(
      `Could not mark raw import as failed: ${error.message}`
    );
  }
}

// ============================================================
// DATABASE UPSERTS
// ============================================================

async function findBrandBySlug(slug) {
  const { data, error } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function upsertBrand(brand, sourceName) {
  const slug = brand.slug || slugify(brand.name);
  const existingBrand = await findBrandBySlug(slug);

  const brandPayload = {
    name: normalizeText(brand.name),
    slug,
    country: normalizeText(brand.country),
    website_url: normalizeText(brand.website_url),
    source_name:
      normalizeText(brand.source_name) ||
      normalizeText(sourceName),
    source_record_id: normalizeText(brand.source_record_id),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("brands")
    .upsert(brandPayload, {
      onConflict: "slug",
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Brand import failed for ${brand.name}: ${error.message}`
    );
  }

  return {
    record: data,
    wasUpdate: Boolean(existingBrand),
  };
}

async function findModel(brandId, slug) {
  const { data, error } = await supabase
    .from("bike_models")
    .select("id")
    .eq("brand_id", brandId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function upsertModel(model, brandId, sourceName) {
  const slug = model.slug || slugify(model.name);
  const existingModel = await findModel(brandId, slug);

  const modelPayload = {
    brand_id: brandId,
    name: normalizeText(model.name),
    slug,
    category: normalizeText(model.category),
    description: normalizeText(model.description),
    introduced_year: normalizeInteger(model.introduced_year),
    discontinued_year: normalizeInteger(model.discontinued_year),
    source_name:
      normalizeText(model.source_name) ||
      normalizeText(sourceName),
    source_record_id: normalizeText(model.source_record_id),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("bike_models")
    .upsert(modelPayload, {
      onConflict: "brand_id,slug",
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Model import failed for ${model.name}: ${error.message}`
    );
  }

  return {
    record: data,
    wasUpdate: Boolean(existingModel),
  };
}

async function findVersion(bikeModelId, year, trimName) {
  const { data, error } = await supabase
    .from("bike_versions")
    .select("id")
    .eq("bike_model_id", bikeModelId)
    .eq("year", year)
    .eq("trim_name", trimName)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function upsertVersion({
  version,
  bikeModelId,
  brandName,
  modelName,
  sourceName,
  importBatchId,
}) {
  const year = normalizeInteger(version.year);
  const trimName = normalizeTrimName(
    version.trim_name ?? version.trim
  );

  const existingVersion = await findVersion(
    bikeModelId,
    year,
    trimName
  );

  const displayName = [year, brandName, modelName, trimName]
    .filter(Boolean)
    .join(" ");

  const generatedSlug =
    version.slug ||
    slugify(
      [brandName, modelName, year, trimName]
        .filter(Boolean)
        .join(" ")
    );

  const versionPayload = {
    bike_model_id: bikeModelId,
    year,
    trim_name: trimName,
    slug: generatedSlug,

    msrp: normalizeNumber(version.msrp),
    currency: normalizeText(version.currency) || "USD",

    frame_material: normalizeText(version.frame_material),
    wheel_size: normalizeText(version.wheel_size),

    front_travel_mm: normalizeNumber(version.front_travel_mm),
    rear_travel_mm: normalizeNumber(version.rear_travel_mm),

    weight_kg: normalizeNumber(version.weight_kg),
    weight_lbs: normalizeNumber(version.weight_lbs),

    fork: normalizeText(version.fork),
    rear_shock: normalizeText(version.rear_shock),
    drivetrain: normalizeText(version.drivetrain),
    brakes: normalizeText(version.brakes),
    wheels: normalizeText(version.wheels),

    image_url: normalizeText(version.image_url),

    status: normalizeText(version.status) || "active",

    source_name:
      normalizeText(version.source_name) ||
      normalizeText(sourceName),

    source_record_id: normalizeText(
      version.source_record_id
    ),

    source_url: normalizeText(version.source_url),

    import_batch_id: importBatchId || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("bike_versions")
    .upsert(versionPayload, {
      onConflict: "bike_model_id,year,trim_name",
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Version import failed for ${displayName}: ${error.message}`
    );
  }

  return {
    record: data,
    wasUpdate: Boolean(existingVersion),
  };
}

// ============================================================
// GEOMETRY IMPORT
// ============================================================

async function upsertGeometry(geometry, bikeVersionId) {
  if (!Array.isArray(geometry) || geometry.length === 0) {
    return 0;
  }

  const geometryRows = geometry.map((row) => {
    if (!row.size) {
      throw new Error(
        "A geometry row is missing its size."
      );
    }

    return {
      bike_version_id: bikeVersionId,
      size: normalizeText(row.size),

      reach_mm: normalizeNumber(row.reach_mm),
      stack_mm: normalizeNumber(row.stack_mm),
      wheelbase_mm: normalizeNumber(row.wheelbase_mm),
      chainstay_mm: normalizeNumber(row.chainstay_mm),
      bb_drop_mm: normalizeNumber(row.bb_drop_mm),

      head_tube_angle: normalizeNumber(
        row.head_tube_angle
      ),

      seat_tube_angle: normalizeNumber(
        row.seat_tube_angle
      ),

      seat_tube_mm: normalizeNumber(row.seat_tube_mm),
      head_tube_mm: normalizeNumber(row.head_tube_mm),
    };
  });

  const { error } = await supabase
    .from("bike_geometry")
    .upsert(geometryRows, {
      onConflict: "bike_version_id,size",
    });

  if (error) {
    throw new Error(
      `Geometry import failed: ${error.message}`
    );
  }

  return geometryRows.length;
}

// ============================================================
// COMPONENT IMPORT
// ============================================================

async function upsertComponent(component) {
  if (!component.name || !component.category) {
    throw new Error(
      "Each component must have a name and category."
    );
  }

  const componentPayload = {
    brand: normalizeText(component.brand) || "Unknown",
    name: normalizeText(component.name),
    category: normalizeText(component.category),
    model_year: normalizeInteger(component.model_year),
    msrp: normalizeNumber(component.msrp),
  };

  const { data, error } = await supabase
    .from("components")
    .upsert(componentPayload, {
      onConflict: "brand,name,category,model_year",
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Component import failed for ${component.name}: ${error.message}`
    );
  }

  return data;
}

async function linkComponentToVersion(
  component,
  bikeVersionId
) {
  const componentRecord = await upsertComponent(component);

  const componentRole =
    normalizeText(component.component_role) ||
    normalizeText(component.role) ||
    normalizeText(component.category);

  const { error } = await supabase
    .from("bike_version_components")
    .upsert(
      {
        bike_version_id: bikeVersionId,
        component_id: componentRecord.id,
        component_role: componentRole,
        notes: normalizeText(component.notes),
      },
      {
        onConflict:
          "bike_version_id,component_id,component_role",
      }
    );

  if (error) {
    throw new Error(
      `Could not link component ${component.name}: ${error.message}`
    );
  }
}

async function upsertComponents(components, bikeVersionId) {
  if (!Array.isArray(components) || components.length === 0) {
    return 0;
  }

  for (const component of components) {
    await linkComponentToVersion(
      component,
      bikeVersionId
    );
  }

  return components.length;
}

// ============================================================
// FILE IMPORT
// ============================================================

async function importFile(fileName) {
  const catalog = readJsonFile(fileName);

  validateCatalog(catalog, fileName);

  const counters = {
    imported: 0,
    updated: 0,
    failed: 0,
    geometryRows: 0,
    componentRows: 0,
  };

  let importBatch = null;

  try {
    importBatch = await createImportBatch(
      fileName,
      catalog
    );

    const sourceName =
      normalizeText(catalog.source_name) ||
      normalizeText(catalog.brand.name);

    const brandResult = await upsertBrand(
      catalog.brand,
      sourceName
    );

    const brand = brandResult.record;

    console.log(`Brand: ${brand.name}`);

    for (const modelInput of catalog.models) {
      const modelResult = await upsertModel(
        modelInput,
        brand.id,
        sourceName
      );

      const model = modelResult.record;

      console.log(`  Model: ${brand.name} ${model.name}`);

      for (const versionInput of modelInput.versions) {
        const trimName = normalizeTrimName(
          versionInput.trim_name ??
            versionInput.trim
        );

        const versionLabel = [
          versionInput.year,
          brand.name,
          model.name,
          trimName,
        ]
          .filter(Boolean)
          .join(" ");

        const generatedSourceRecordId =
          normalizeText(versionInput.source_record_id) ||
          slugify(versionLabel);

        const rawImport = await saveRawImport({
          importBatchId: importBatch?.id,
          sourceName,
          sourceRecordId: generatedSourceRecordId,
          rawData: {
            brand: catalog.brand,
            model: {
              ...modelInput,
              versions: undefined,
            },
            version: versionInput,
          },
        });

        try {
          const versionResult = await upsertVersion({
            version: {
              ...versionInput,
              source_record_id:
                versionInput.source_record_id ||
                generatedSourceRecordId,
            },
            bikeModelId: model.id,
            brandName: brand.name,
            modelName: model.name,
            sourceName,
            importBatchId: importBatch?.id,
          });

          const version = versionResult.record;

          if (versionResult.wasUpdate) {
            counters.updated += 1;
            console.log(`    Updated: ${versionLabel}`);
          } else {
            counters.imported += 1;
            console.log(`    Imported: ${versionLabel}`);
          }

          const geometryCount = await upsertGeometry(
            versionInput.geometry,
            version.id
          );

          counters.geometryRows += geometryCount;

          if (geometryCount > 0) {
            console.log(
              `      Geometry rows: ${geometryCount}`
            );
          }

          const componentCount = await upsertComponents(
            versionInput.components,
            version.id
          );

          counters.componentRows += componentCount;

          if (componentCount > 0) {
            console.log(
              `      Components: ${componentCount}`
            );
          }

          await markRawImportProcessed(rawImport?.id);
        } catch (error) {
          counters.failed += 1;

          console.error(
            `    Failed: ${versionLabel}`
          );

          console.error(`      ${error.message}`);

          await markRawImportFailed(
            rawImport?.id,
            error.message
          );
        }
      }
    }

    await completeImportBatch(
      importBatch?.id,
      counters
    );

    console.log(`\nFinished ${fileName}`);
    console.log(`  New versions: ${counters.imported}`);
    console.log(`  Updated versions: ${counters.updated}`);
    console.log(`  Failed versions: ${counters.failed}`);
    console.log(
      `  Geometry rows processed: ${counters.geometryRows}`
    );
    console.log(
      `  Components processed: ${counters.componentRows}`
    );

    return counters;
  } catch (error) {
    await failImportBatch(
      importBatch?.id,
      error.message,
      counters
    );

    throw error;
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const requestedFileNames =
    process.argv.slice(2);

  const importsDirectory =
    getImportsDirectory();

  if (!fs.existsSync(importsDirectory)) {
    throw new Error(
      `Imports folder not found: ${importsDirectory}`
    );
  }

  let jsonFiles;

  /*
   * When filenames are supplied, import only those files.
   *
   * Example:
   * node scripts/import-bikes.js bike-one.json bike-two.json
   */
  if (requestedFileNames.length > 0) {
    jsonFiles = requestedFileNames;
  } else {
    /*
     * With no filenames, retain the existing bulk-import mode.
     */
    jsonFiles = fs
      .readdirSync(importsDirectory)
      .filter(
        (file) =>
          file
            .toLowerCase()
            .endsWith(".json") &&
          !file
            .toLowerCase()
            .includes("generated")
      )
      .sort();
  }

  if (jsonFiles.length === 0) {
    console.log(
      "No JSON import files found."
    );

    return;
  }

  console.log(
    `Found ${jsonFiles.length} import file${
      jsonFiles.length === 1 ? "" : "s"
    }.\n`
  );

  const totals = {
    imported: 0,
    updated: 0,
    failed: 0,
    geometryRows: 0,
    componentRows: 0,
    fileFailures: 0,
  };

  for (const jsonFile of jsonFiles) {
    console.log("\n========================================");
    console.log(`IMPORTING ${jsonFile}`);
    console.log("========================================\n");

    try {
      const counters =
        await importFile(jsonFile);

      totals.imported +=
        counters.imported;

      totals.updated +=
        counters.updated;

      totals.failed +=
        counters.failed;

      totals.geometryRows +=
        counters.geometryRows;

      totals.componentRows +=
        counters.componentRows;
    } catch (error) {
      totals.fileFailures += 1;

      console.error(
        `Could not import ${jsonFile}: ${error.message}`
      );
    }
  }

  console.log("\n========================================");
  console.log("ALL IMPORTS COMPLETE");
  console.log("========================================");
  console.log(
    `Files requested: ${jsonFiles.length}`
  );
  console.log(
    `File-level failures: ${totals.fileFailures}`
  );
  console.log(
    `New versions: ${totals.imported}`
  );
  console.log(
    `Updated versions: ${totals.updated}`
  );
  console.log(
    `Failed versions: ${totals.failed}`
  );
  console.log(
    `Geometry rows processed: ${totals.geometryRows}`
  );
  console.log(
    `Components processed: ${totals.componentRows}`
  );

  if (
    totals.failed > 0 ||
    totals.fileFailures > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nImport failed:");
  console.error(error);

  process.exitCode = 1;
});