const path = require("path");
const { spawn } = require("child_process");

const brands = require("./config/brands");
const {
  getCatalogLinks,
} = require("./scrapers/propain/catalog");

const BRAND = brands.propain;
const DEFAULT_YEAR = 2025;

function runNodeScript(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: path.join(__dirname, ".."),
      env: process.env,
      ...options,
    });

    child.on("error", reject);

    child.on("close", (exitCode) => {
      resolve(exitCode ?? 1);
    });
  });
}

function runScraper(year, url) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        "scripts/scrape-propain.js",
        String(year),
        url,
      ],
      {
        cwd: path.join(__dirname, ".."),
        env: process.env,
        stdio: ["inherit", "pipe", "pipe"],
      }
    );

    let outputFileName = null;

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();

      process.stdout.write(text);

      const savedPathMatch = text.match(
        /Saved to:\s*(.+\.json)/i
      );

      if (savedPathMatch) {
        outputFileName = path.basename(
          savedPathMatch[1].trim()
        );
      }
    });

    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk.toString());
    });

    child.on("error", reject);

    child.on("close", (exitCode) => {
      resolve({
        url,
        success:
          exitCode === 0 &&
          Boolean(outputFileName),
        exitCode: exitCode ?? 1,
        outputFileName,
      });
    });
  });
}

async function importFreshFiles(fileNames) {
  if (
    !Array.isArray(fileNames) ||
    fileNames.length === 0
  ) {
    console.log(
      "\nNo newly scraped files are available to import."
    );

    return {
      success: false,
      exitCode: 1,
    };
  }

  console.log("\n========================================");
  console.log("STARTING AUTOMATIC IMPORT");
  console.log("========================================");
  console.log(
    `Importing ${fileNames.length} freshly scraped files.\n`
  );

  const exitCode = await runNodeScript(
    [
      "scripts/import-bikes.js",
      ...fileNames,
    ],
    {
      stdio: "inherit",
    }
  );

  return {
    success: exitCode === 0,
    exitCode,
  };
}

async function main() {
  const requestedYear =
    Number(process.argv[2]) || DEFAULT_YEAR;

  if (!Number.isInteger(requestedYear)) {
    throw new Error(
      "Model year must be a valid integer."
    );
  }

  console.log(
    `Discovering ${BRAND.name} catalog for model year ${requestedYear}...\n`
  );

  const urls = await getCatalogLinks(
    BRAND.catalogUrl
  );

  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error(
      `No ${BRAND.name} product URLs were found.`
    );
  }

  console.log(
    `Found ${urls.length} product pages.\n`
  );

  const scrapeResults = [];

  for (
    let index = 0;
    index < urls.length;
    index += 1
  ) {
    const url = urls[index];

    console.log("\n========================================");
    console.log(
      `SCRAPING ${index + 1} OF ${urls.length}`
    );
    console.log(url);
    console.log("========================================\n");

    try {
      const result = await runScraper(
        requestedYear,
        url
      );

      scrapeResults.push(result);
    } catch (error) {
      console.error(
        `Scraper process failed for ${url}: ${error.message}`
      );

      scrapeResults.push({
        url,
        success: false,
        exitCode: 1,
        outputFileName: null,
      });
    }
  }

  const successfulScrapes =
    scrapeResults.filter(
      (result) => result.success
    );

  const failedScrapes =
    scrapeResults.filter(
      (result) => !result.success
    );

  const freshFileNames = [
    ...new Set(
      successfulScrapes
        .map(
          (result) =>
            result.outputFileName
        )
        .filter(Boolean)
    ),
  ];

  console.log("\n========================================");
  console.log(
    `${BRAND.name.toUpperCase()} CATALOG SCRAPE COMPLETE`
  );
  console.log("========================================");
  console.log(
    `Total pages: ${scrapeResults.length}`
  );
  console.log(
    `Successful: ${successfulScrapes.length}`
  );
  console.log(
    `Failed: ${failedScrapes.length}`
  );
  console.log(
    `Fresh JSON files: ${freshFileNames.length}`
  );

  if (failedScrapes.length > 0) {
    console.log("\nFailed URLs:");

    for (const result of failedScrapes) {
      console.log(
        `- ${result.url} (exit ${result.exitCode})`
      );
    }
  }

  let importResult = {
    success: false,
    exitCode: 1,
  };

  if (freshFileNames.length > 0) {
    importResult = await importFreshFiles(
      freshFileNames
    );
  }

  console.log("\n========================================");
  console.log(
    `${BRAND.name.toUpperCase()} PIPELINE SUMMARY`
  );
  console.log("========================================");
  console.log(
    `Model year: ${requestedYear}`
  );
  console.log(
    `Pages discovered: ${scrapeResults.length}`
  );
  console.log(
    `Pages scraped: ${successfulScrapes.length}`
  );
  console.log(
    `Scrape failures: ${failedScrapes.length}`
  );
  console.log(
    `Files sent to importer: ${freshFileNames.length}`
  );
  console.log(
    `Import status: ${
      importResult.success
        ? "Successful"
        : "Failed"
    }`
  );

  if (
    failedScrapes.length > 0 ||
    !importResult.success
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    `\n${BRAND.name} pipeline failed:`
  );
  console.error(error.message);

  process.exitCode = 1;
});