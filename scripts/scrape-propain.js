const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const DEFAULT_URL =
  "https://www.propain-bikes.com/us/product/bikes/enduro/tyee-al/";

// ============================================================
// GENERAL HELPERS
// ============================================================

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value)
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || null;
}

function parseNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const match = String(value)
    .replace(/,/g, "")
    .match(/-?\d+(\.\d+)?/);

  return match ? Number(match[0]) : null;
}

function normalizeRowName(value) {
  return cleanText(value)
    ?.toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// JSON-LD EXTRACTION
// ============================================================

function findProductSchema(schema) {
  if (!schema || typeof schema !== "object") {
    return null;
  }

  if (schema["@type"] === "Product") {
    return schema;
  }

  if (Array.isArray(schema["@graph"])) {
    const product = schema["@graph"].find(
      (item) => item?.["@type"] === "Product"
    );

    if (product) {
      return product;
    }
  }

  if (Array.isArray(schema)) {
    for (const item of schema) {
      const product = findProductSchema(item);

      if (product) {
        return product;
      }
    }
  }

  return null;
}

function extractProductFromHtml(html) {
  const $ = cheerio.load(html);

  const scripts = $(
    'script[type="application/ld+json"]'
  ).toArray();

  for (const element of scripts) {
    const rawJson = $(element).html();

    if (!rawJson) {
      continue;
    }

    try {
      const parsedJson = JSON.parse(rawJson);
      const product = findProductSchema(parsedJson);

      if (product) {
        return product;
      }
    } catch (error) {
      console.warn(
        `Skipped invalid JSON-LD: ${error.message}`
      );
    }
  }

  throw new Error(
    "No Product JSON-LD schema was found."
  );
}

function getAdditionalProperties(product) {
  const properties = {};

  if (!Array.isArray(product.additionalProperty)) {
    return properties;
  }

  for (const property of product.additionalProperty) {
    if (!property?.name) {
      continue;
    }

    properties[property.name] =
      property.value ?? null;
  }

  return properties;
}

function getOffer(product) {
  if (Array.isArray(product.offers)) {
    return product.offers[0] || {};
  }

  return product.offers || {};
}

function getImageUrl(product) {
  if (typeof product.image === "string") {
    return product.image;
  }

  if (Array.isArray(product.image)) {
    const firstImage = product.image[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    return (
      firstImage?.url ||
      firstImage?.contentUrl ||
      null
    );
  }

  if (
    product.image &&
    typeof product.image === "object"
  ) {
    return (
      product.image.url ||
      product.image.contentUrl ||
      null
    );
  }

  return null;
}

// ============================================================
// PRODUCT NAME PARSING
// ============================================================

function cleanProductName(productName) {
  return cleanText(productName)
    ?.replace(/\|\s*PROPAIN.*$/i, "")
    .replace(/\s*\|\s*.*$/i, "")
    .trim();
}

function splitModelAndTrim(productName) {
  const cleanedName = cleanProductName(productName);

  if (!cleanedName) {
    return {
      modelName: "Unknown Model",
      trimName: "",
    };
  }

  const words = cleanedName.split(" ");

  const versionIndex = words.findIndex((word) =>
    /^\d+(\.\d+)*$/.test(word)
  );

  if (versionIndex > 0) {
    return {
      modelName: words
        .slice(0, versionIndex)
        .join(" "),

      trimName: words
        .slice(versionIndex)
        .join(" "),
    };
  }

  const finalWord =
    words[words.length - 1]?.toUpperCase();

  if (
    words.length > 1 &&
    ["AL", "CF", "CARBON"].includes(finalWord)
  ) {
    return {
      modelName: words
        .slice(0, -1)
        .join(" "),

      trimName: words[words.length - 1],
    };
  }

  return {
    modelName: cleanedName,
    trimName: "",
  };
}

function determineFrameMaterial(rawMaterial) {
  const value = cleanText(rawMaterial);

  if (!value) {
    return null;
  }

  const lowerValue = value.toLowerCase();

  if (lowerValue.includes("carbon")) {
    return "Carbon";
  }

  if (
    lowerValue.includes("aluminum") ||
    lowerValue.includes("aluminium") ||
    lowerValue.includes("alloy")
  ) {
    return "Aluminum";
  }

  return value;
}

// ============================================================
// GEOMETRY EXTRACTION
// ============================================================

function findRecommendedGeometryTable($) {
  const recommendedHeading = $("h5")
    .filter((_, element) => {
      const headingText = cleanText($(element).text());

      return headingText
        ?.toLowerCase()
        .includes("recommended position");
    })
    .first();

  if (!recommendedHeading.length) {
    return null;
  }

  const headingWidget =
    recommendedHeading.closest(".elementor-element");

  const table = headingWidget
    .nextAll(".elementor-widget-html")
    .first()
    .find("table")
    .first();

  return table.length ? table : null;
}

function getGeometryTableData($, table) {
  const headers = table
    .find("thead th")
    .toArray()
    .slice(1)
    .map((element) => {
      return cleanText($(element).text())
        ?.replace(/^SIZE\s+/i, "")
        .trim();
    });

  const rows = {};

  table.find("tbody tr").each((_, rowElement) => {
    const cells = $(rowElement)
      .find("td")
      .toArray();

    if (cells.length < 2) {
      return;
    }

    const rowName = normalizeRowName(
      $(cells[0]).text()
    );

    if (!rowName) {
      return;
    }

    rows[rowName] = cells
      .slice(1)
      .map((cell) => cleanText($(cell).text()));
  });

  return {
    headers,
    rows,
  };
}

function findRow(rows, searchText) {
  const normalizedSearch =
    searchText.toLowerCase();

  const matchingKey = Object.keys(rows).find(
    (rowName) =>
      rowName.includes(normalizedSearch)
  );

  return matchingKey
    ? rows[matchingKey]
    : [];
}

function chooseGeometryColumns(headers, wheelValues) {
  const selectedColumns = [];

  const indexesBySize = {};

  headers.forEach((size, index) => {
    if (!size) {
      return;
    }

    if (!indexesBySize[size]) {
      indexesBySize[size] = [];
    }

    indexesBySize[size].push(index);
  });

  for (const [size, indexes] of Object.entries(
    indexesBySize
  )) {
    if (indexes.length === 1) {
      selectedColumns.push({
        size,
        index: indexes[0],
      });

      continue;
    }

    /*
     * Propain lists Medium twice:
     *
     * M with 27.5-inch wheels
     * M with Mix/29-inch wheels
     *
     * For the main MTB Index geometry record, prefer
     * the Mix/29 configuration.
     */
    const preferredIndex = indexes.find((index) => {
      const wheelText =
        wheelValues[index]?.toLowerCase() || "";

      return (
        wheelText.includes("mix") ||
        wheelText.includes("29")
      );
    });

    selectedColumns.push({
      size,
      index:
        preferredIndex !== undefined
          ? preferredIndex
          : indexes[indexes.length - 1],
    });
  }

  return selectedColumns;
}

function extractGeometryFromHtml(html) {
  const $ = cheerio.load(html);

  const table = findRecommendedGeometryTable($);

  if (!table) {
    console.warn(
      "No Recommended Position geometry table found."
    );

    return [];
  }

  const { headers, rows } =
    getGeometryTableData($, table);

  const wheelValues = findRow(
    rows,
    "wheelsize"
  );

  const selectedColumns =
    chooseGeometryColumns(
      headers,
      wheelValues
    );

  const frameHeightValues = findRow(
    rows,
    "frame height"
  );

  const headTubeValues = findRow(
    rows,
    "head tube length"
  );

  const reachValues = findRow(
    rows,
    "reach"
  );

  const stackValues = findRow(
    rows,
    "stack"
  );

  const headAngleValues = findRow(
    rows,
    "head angle"
  );

  const effectiveSeatAngleValues = findRow(
    rows,
    "seat angle - effective"
  );

  const bbOffsetValues = findRow(
    rows,
    "bb offset"
  );

  const chainstayValues = findRow(
    rows,
    "chainstay length"
  );

  const wheelbaseValues = findRow(
    rows,
    "wheelbase"
  );

  return selectedColumns.map(({ size, index }) => ({
    size,

    reach_mm:
      parseNumber(reachValues[index]),

    stack_mm:
      parseNumber(stackValues[index]),

    wheelbase_mm:
      parseNumber(wheelbaseValues[index]),

    chainstay_mm:
      parseNumber(chainstayValues[index]),

    bb_drop_mm:
      parseNumber(bbOffsetValues[index]),

    head_tube_angle:
      parseNumber(headAngleValues[index]),

    seat_tube_angle:
      parseNumber(
        effectiveSeatAngleValues[index]
      ),

    seat_tube_mm:
      parseNumber(frameHeightValues[index]),

    head_tube_mm:
      parseNumber(headTubeValues[index]),
  }));
}

// ============================================================
// PAGE DOWNLOAD
// ============================================================

async function downloadPage(url) {
  const response = await axios.get(url, {
    timeout: 30000,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/148 Safari/537.36",

      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",

      "Accept-Language":
        "en-US,en;q=0.9",
    },
  });

  return response.data;
}

// ============================================================
// CATALOG BUILDING
// ============================================================

function buildCatalog(
  product,
  url,
  requestedYear,
  geometry
) {
  const year = Number(requestedYear);

  if (!Number.isInteger(year)) {
    throw new Error(
      "A valid model year is required. Example: node scripts/scrape-propain.js 2025"
    );
  }

  const properties =
    getAdditionalProperties(product);

  const offer = getOffer(product);

  const { modelName, trimName } =
    splitModelAndTrim(product.name);

  const frameMaterial =
    determineFrameMaterial(
      properties["pa_frame-material"]
    );

  const category =
    cleanText(properties.pa_terrain) ||
    cleanText(product.category)
      ?.split(">")
      .pop()
      ?.trim() ||
    null;

  const availableSizes =
    cleanText(properties["pa_frame-size"])
      ?.split(",")
      .map((size) => size.trim())
      .filter(Boolean) || [];

  const baseSourceId =
    cleanText(product.sku) ||
    slugify(`${modelName}-${trimName}`);

  const sourceRecordId = slugify(
    `${baseSourceId}-${year}`
  );

  return {
    source_name: "Propain",
    source_url: url,

    brand: {
      name: "Propain",
      slug: "propain",
      country: "Germany",

      website_url:
        "https://www.propain-bikes.com",
    },

    models: [
      {
        name: modelName,
        slug: slugify(modelName),
        category,

        description:
          cleanText(product.description),

        introduced_year: null,
        discontinued_year: null,

        versions: [
          {
            year,
            trim_name: trimName,

            currency:
              cleanText(offer.priceCurrency) ||
              "USD",

            msrp: parseNumber(offer.price),

            frame_material:
              frameMaterial,

            wheel_size: null,

            front_travel_mm: parseNumber(
              properties["pa_travel-front"]
            ),

            rear_travel_mm: parseNumber(
              properties["pa_travel-rear"]
            ),

            weight_kg: null,
            weight_lbs: null,

            fork: null,
            rear_shock: null,
            drivetrain: null,
            brakes: null,
            wheels: null,

            image_url:
              getImageUrl(product),

            source_name: "Propain",

            source_record_id:
              sourceRecordId,

            source_url:
              cleanText(offer.url) || url,

            status: "active",

            available_sizes:
              availableSizes,

            geometry,

            components: [],
          },
        ],
      },
    ],
  };
}

// ============================================================
// OUTPUT
// ============================================================

function writeCatalog(catalog) {
  const model = catalog.models[0];
  const version = model.versions[0];

  const outputFileName =
    [
      "propain",
      slugify(model.name),
      version.year,
      slugify(
        version.trim_name || "base"
      ),
    ].join("-") + ".json";

  const outputPath = path.join(
    __dirname,
    "..",
    "imports",
    outputFileName
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(catalog, null, 2),
    "utf8"
  );

  return {
    outputPath,
    outputFileName,
  };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const requestedYear = process.argv[2];

  const url =
    process.argv[3] || DEFAULT_URL;

  console.log(`Downloading: ${url}`);

  const html = await downloadPage(url);

  const product =
    extractProductFromHtml(html);

  const geometry =
    extractGeometryFromHtml(html);

  const catalog = buildCatalog(
    product,
    url,
    requestedYear,
    geometry
  );

  const {
    outputPath,
    outputFileName,
  } = writeCatalog(catalog);

  const model = catalog.models[0];
  const version = model.versions[0];

  console.log("\nProduct found:");
  console.log(`  Model: ${model.name}`);

  console.log(
    `  Trim: ${version.trim_name || "None"}`
  );

  console.log(`  Year: ${version.year}`);

  console.log(
    `  MSRP: ${version.currency} ${version.msrp}`
  );

  console.log(
    `  Frame: ${version.frame_material}`
  );

  console.log(
    `  Front travel: ${version.front_travel_mm} mm`
  );

  console.log(
    `  Rear travel: ${version.rear_travel_mm} mm`
  );

  console.log(
    `  Sizes: ${version.available_sizes.join(", ")}`
  );

  console.log(
    `  Geometry rows: ${version.geometry.length}`
  );

  for (const row of version.geometry) {
    console.log(
      `    ${row.size}: reach ${row.reach_mm}, stack ${row.stack_mm}, wheelbase ${row.wheelbase_mm}`
    );
  }

  console.log(
    `  Image: ${version.image_url}`
  );

  console.log(
    `\nSaved to: ${outputPath}`
  );

  console.log("\nNext command:");

  console.log(
    `node scripts/import-bikes.js ${outputFileName}`
  );
}

main().catch((error) => {
  console.error("\nScrape failed:");
  console.error(error.message);

  process.exitCode = 1;
});