const {
  cleanText,
  parseNumber,
  normalizeRowName,
} = require("./helpers");

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

  const headingWidget = recommendedHeading.closest(
    ".elementor-element"
  );

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
    .map((element) =>
      cleanText($(element).text())
        ?.replace(/^SIZE\s+/i, "")
        .trim()
    );

  const rows = {};

  table.find("tbody tr").each((_, rowElement) => {
    const cells = $(rowElement).find("td").toArray();

    if (cells.length < 2) {
      return;
    }

    const rowName = normalizeRowName($(cells[0]).text());

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
  const normalizedSearch = searchText.toLowerCase();

  const matchingKey = Object.keys(rows).find((rowName) =>
    rowName.includes(normalizedSearch)
  );

  return matchingKey ? rows[matchingKey] : [];
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

  for (const [size, indexes] of Object.entries(indexesBySize)) {
    if (indexes.length === 1) {
      selectedColumns.push({
        size,
        index: indexes[0],
      });

      continue;
    }

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

function scrapeGeometry($) {
  const table = findRecommendedGeometryTable($);

  if (!table) {
    console.warn(
      "No Recommended Position geometry table found."
    );

    return [];
  }

  const { headers, rows } = getGeometryTableData($, table);

  const wheelValues = findRow(rows, "wheelsize");

  const selectedColumns = chooseGeometryColumns(
    headers,
    wheelValues
  );

  const frameHeightValues = findRow(rows, "frame height");
  const headTubeValues = findRow(rows, "head tube length");
  const reachValues = findRow(rows, "reach");
  const stackValues = findRow(rows, "stack");
  const headAngleValues = findRow(rows, "head angle");

  const effectiveSeatAngleValues = findRow(
    rows,
    "seat angle - effective"
  );

  const bbOffsetValues = findRow(rows, "bb offset");
  const chainstayValues = findRow(rows, "chainstay length");
  const wheelbaseValues = findRow(rows, "wheelbase");

  return selectedColumns.map(({ size, index }) => ({
    size,

    reach_mm: parseNumber(reachValues[index]),
    stack_mm: parseNumber(stackValues[index]),
    wheelbase_mm: parseNumber(wheelbaseValues[index]),
    chainstay_mm: parseNumber(chainstayValues[index]),
    bb_drop_mm: parseNumber(bbOffsetValues[index]),

    head_tube_angle: parseNumber(
      headAngleValues[index]
    ),

    seat_tube_angle: parseNumber(
      effectiveSeatAngleValues[index]
    ),

    seat_tube_mm: parseNumber(
      frameHeightValues[index]
    ),

    head_tube_mm: parseNumber(
      headTubeValues[index]
    ),
  }));
}

module.exports = {
  scrapeGeometry,
};