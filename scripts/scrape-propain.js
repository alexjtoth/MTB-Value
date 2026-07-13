const axios = require("axios");
const cheerio = require("cheerio");

const brands = require("./config/brands");

const {
  scrapeProduct,
} = require("./scrapers/propain/product");

const {
  scrapeGeometry,
} = require("./scrapers/propain/geometry");

const {
  scrapeComponents,
} = require("./scrapers/propain/components");

const {
  buildCatalog,
  writeCatalog,
} = require("./scrapers/propain/output");

const BRAND = brands.propain;

const DEFAULT_URL =
  "https://www.propain-bikes.com/us/product/bikes/enduro/tyee-al/";

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

function printSummary(
  catalog,
  outputPath,
  outputFileName
) {
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
    `  Components: ${version.components.length}`
  );

  for (const component of version.components) {
    console.log(
      `    ${component.category}: ${component.brand} ${component.name}`
    );
  }

  console.log(
    `  Image: ${version.image_url}`
  );

  console.log(`\nSaved to: ${outputPath}`);

  console.log("\nNext command:");

  console.log(
    `node scripts/import-bikes.js ${outputFileName}`
  );
}

async function main() {
  const requestedYear = process.argv[2];
  const url = process.argv[3] || DEFAULT_URL;

  if (!requestedYear) {
    throw new Error(
      `Usage: node scripts/scrape-propain.js 2025 "PRODUCT_URL"`
    );
  }

  console.log(`Downloading: ${url}`);

  const html = await downloadPage(url);
  const $ = cheerio.load(html);

  const productData = scrapeProduct(
    $,
    requestedYear,
    url
  );

  const geometry = scrapeGeometry($);
  const components = scrapeComponents($);

  const catalog = buildCatalog({
    sourceUrl: url,
    brand: {
      ...productData.brand,
      name: BRAND.name,
      website_url: BRAND.baseUrl,
    },
    model: productData.model,
    version: productData.version,
    geometry,
    components,
  });

  const {
    outputPath,
    outputFileName,
  } = writeCatalog(catalog);

  printSummary(
    catalog,
    outputPath,
    outputFileName
  );
}

main().catch((error) => {
  console.error(
    `\n${BRAND.name} scrape failed:`
  );

  console.error(error.message);

  process.exitCode = 1;
});