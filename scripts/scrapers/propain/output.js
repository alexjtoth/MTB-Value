const fs = require("fs");
const path = require("path");

const {
  slugify,
} = require("./helpers");

function buildCatalog({
  sourceUrl,
  brand,
  model,
  version,
  geometry,
  components,
}) {
  return {
    source_name: brand.name,
    source_url: sourceUrl,

    brand,

    models: [
      {
        ...model,

        versions: [
          {
            ...version,
            geometry,
            components,
          },
        ],
      },
    ],
  };
}

function writeCatalog(catalog) {
  const model = catalog.models[0];
  const version = model.versions[0];

  const outputFileName =
    [
      slugify(catalog.brand.name),
      slugify(model.name),
      version.year,
      slugify(
        version.trim_name || "base"
      ),
    ].join("-") + ".json";

  const outputPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "imports",
    outputFileName
  );

  fs.mkdirSync(
    path.dirname(outputPath),
    {
      recursive: true,
    }
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

module.exports = {
  buildCatalog,
  writeCatalog,
};