const { cleanText, parseNumber } = require("./helpers");

const KNOWN_BRANDS = [
  "RockShox",
  "Fox",
  "Marzocchi",
  "SRAM",
  "Shimano",
  "Magura",
  "Hayes",
  "TRP",
  "Crankbrothers",
  "Crankbrother",
  "DT Swiss",
  "Newmen",
  "OneUp",
  "Sixpack",
  "Ergon",
  "Maxxis",
  "Schwalbe",
  "Continental",
  "Race Face",
];

function normalizeCategory(category) {
  const value = cleanText(category);

  if (!value) {
    return null;
  }

  const lowerValue = value.toLowerCase();

  const categoryMap = {
    fork: "Fork",
    shock: "Shock",
    drivetrain: "Drivetrain",
    brakes: "Brakes",
    brake: "Brakes",
    wheels: "Wheels",
    wheelset: "Wheels",
    tires: "Tires",
    tyre: "Tires",
    tyres: "Tires",
    stem: "Stem",
    handlebar: "Handlebar",
    grips: "Grips",
    seatpost: "Seatpost",
    dropper: "Seatpost",
    saddle: "Saddle",
  };

  return categoryMap[lowerValue] || value;
}

function detectBrand(rawName) {
  const value = cleanText(rawName);

  if (!value) {
    return "Unknown";
  }

  const matchingBrand = KNOWN_BRANDS.find((brand) =>
    value.toLowerCase().startsWith(brand.toLowerCase())
  );

  if (matchingBrand === "Crankbrother") {
    return "Crankbrothers";
  }

  return matchingBrand || value.split(" ")[0] || "Unknown";
}

function removeBrandFromName(rawName, brand) {
  const value = cleanText(rawName);

  if (!value || !brand || brand === "Unknown") {
    return value;
  }

  const brandVariants = {
    Crankbrothers: ["Crankbrothers", "Crankbrother"],
  };

  const variants = brandVariants[brand] || [brand];

  for (const variant of variants) {
    const pattern = new RegExp(
      `^${escapeRegExp(variant)}\\s*`,
      "i"
    );

    if (pattern.test(value)) {
      return value.replace(pattern, "").trim();
    }
  }

  return value;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildAttributes(category, rawName) {
  const attributes = {};

  if (category === "Fork") {
    const travelMatch = rawName.match(/(\d{2,3})\s*mm/i);

    if (travelMatch) {
      attributes.travel_mm = Number(travelMatch[1]);
    }
  }

  if (category === "Brakes") {
    const rotorMatches = [
      ...rawName.matchAll(/(\d{3})\s*mm/gi),
    ].map((match) => Number(match[1]));

    if (rotorMatches.length >= 1) {
      attributes.front_rotor_mm = rotorMatches[0];
    }

    if (rotorMatches.length >= 2) {
      attributes.rear_rotor_mm = rotorMatches[1];
    }
  }

  if (category === "Drivetrain") {
    const drivetrainMatch = rawName.match(
      /\((\d+)x(\d+)\)/i
    );

    if (drivetrainMatch) {
      attributes.chainrings = Number(drivetrainMatch[1]);
      attributes.speeds = Number(drivetrainMatch[2]);
    }
  }

  if (category === "Handlebar") {
    const riseMatch = rawName.match(/(\d+)\s*mm\s*rise/i);

    if (riseMatch) {
      attributes.rise_mm = Number(riseMatch[1]);
    }

    if (rawName.toLowerCase().includes("carbon")) {
      attributes.material = "Carbon";
    }

    if (rawName.toLowerCase().includes("alloy")) {
      attributes.material = "Aluminum";
    }
  }

  if (category === "Seatpost") {
    const travelValues = [
      ...rawName.matchAll(/(\d{2,3})\s*mm/gi),
    ].map((match) => Number(match[1]));

    if (travelValues.length > 0) {
      attributes.travel_options_mm = [
        ...new Set(travelValues),
      ];
    }
  }

  return attributes;
}

function cleanComponentModel(category, rawName, brand) {
  let name = removeBrandFromName(rawName, brand);

  if (!name) {
    return rawName;
  }

  if (category === "Fork") {
    name = name.replace(/\s+\d{2,3}\s*mm.*$/i, "");
  }

  if (category === "Brakes") {
    name = name.replace(
      /\s+\d{3}\s*mm\s*\/\s*\d{3}\s*mm.*$/i,
      ""
    );
  }

  if (category === "Drivetrain") {
    name = name.replace(/\s*\(\d+x\d+\)\s*$/i, "");
  }

  return name.trim();
}

function normalizeComponent(categoryValue, rawNameValue) {
  const category = normalizeCategory(categoryValue);
  const rawName = cleanText(rawNameValue);

  if (!category || !rawName) {
    return null;
  }

  const brand = detectBrand(rawName);
  const name = cleanComponentModel(
    category,
    rawName,
    brand
  );

  return {
    category,
    component_role: category,
    brand,
    name,
    raw_name: rawName,
    model_year: 0,
    msrp: null,
    attributes: buildAttributes(category, rawName),
  };
}

function findComponentTable($) {
  const expectedCategories = new Set([
    "fork",
    "shock",
    "drivetrain",
    "brakes",
    "wheels",
    "tires",
    "stem",
    "handlebar",
    "grips",
    "seatpost",
    "saddle",
  ]);

  const matchingTable = $("table").filter((_, tableElement) => {
    const rowLabels = $(tableElement)
      .find("tbody tr th")
      .toArray()
      .map((element) =>
        cleanText($(element).text())?.toLowerCase()
      )
      .filter(Boolean);

    const matchingRows = rowLabels.filter((label) =>
      expectedCategories.has(label)
    );

    return matchingRows.length >= 4;
  });

  return matchingTable.first();
}

function scrapeComponents($) {
  const table = findComponentTable($);

  if (!table.length) {
    console.warn("No component specification table found.");
    return [];
  }

  const components = [];

  table.find("tbody tr").each((_, rowElement) => {
    const category = cleanText(
      $(rowElement).find("th").first().text()
    );

    const rawName = cleanText(
      $(rowElement).find("td").first().text()
    );

    const component = normalizeComponent(
      category,
      rawName
    );

    if (component) {
      components.push(component);
    }
  });

  return components;
}

module.exports = {
  scrapeComponents,
  normalizeComponent,
};