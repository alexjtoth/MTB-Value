const { spawn } = require("child_process");
const { getCatalogLinks } = require("./scrapers/catalog");
const { execSync } = require("child_process");

const DEFAULT_YEAR = 2025;

function runScraper(year, url) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        "scripts/scrape-propain.js",
        String(year),
        url,
      ],
      {
        stdio: "inherit",
      }
    );

    child.on("close", (code) => {
      resolve({
        url,
        success: code === 0,
        exitCode: code,
      });
    });
  });
}

async function main() {
  const requestedYear =
    Number(process.argv[2]) || DEFAULT_YEAR;

  console.log(
    `Discovering Propain catalog for model year ${requestedYear}...\n`
  );

  const urls = await getCatalogLinks();

  if (urls.length === 0) {
    throw new Error(
      "No Propain product URLs were found."
    );
  }

  console.log(
    `Found ${urls.length} product pages.\n`
  );

  const results = [];

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];

    console.log("\n========================================");
    console.log(
      `Scraping ${index + 1} of ${urls.length}`
    );
    console.log(url);
    console.log("========================================\n");

    const result = await runScraper(
      requestedYear,
      url
    );

    results.push(result);
  }

  const successful = results.filter(
    (result) => result.success
  );

  const failed = results.filter(
    (result) => !result.success
  );

  console.log("\n========================================");
  console.log("PROPAIN CATALOG SCRAPE COMPLETE");
  console.log("========================================");
  console.log(`Total pages: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (successful.length > 0) {
  console.log("\nStarting automatic import...");

  execSync("node scripts/import-bikes.js", {
    stdio: "inherit",
  });

  console.log("\nEverything imported successfully.");
}

  if (failed.length > 0) {
    console.log("\nFailed URLs:");

    for (const result of failed) {
      console.log(
        `- ${result.url} (exit ${result.exitCode})`
      );
    }

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nCatalog scrape failed:");
  console.error(error.message);
  process.exitCode = 1;
});