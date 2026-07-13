const { cleanText, parseNumber, slugify } = require("./helpers");

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

function extractProductSchema($) {
  const scripts = $('script[type="application/ld+json"]').toArray();

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
      console.warn(`Skipped invalid JSON-LD: ${error.message}`);
    }
  }

  throw new Error("No Product JSON-LD schema was found.");
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

    properties[property.name] = property.value ?? null;
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

    return firstImage?.url || firstImage?.contentUrl || null;
  }

  if (product.image && typeof product.image === "object") {
    return product.image.url || product.image.contentUrl || null;
  }

  return null;
}

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
      modelName: words.slice(0, versionIndex).join(" "),
      trimName: words.slice(versionIndex).join(" "),
    };
  }

  const finalWord = words[words.length - 1]?.toUpperCase();

  if (
    words.length > 1 &&
    ["AL", "CF", "CARBON"].includes(finalWord)
  ) {
    return {
      modelName: words.slice(0, -1).join(" "),
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

function scrapeProduct($, requestedYear, url) {
  const year = Number(requestedYear);

  if (!Number.isInteger(year)) {
    throw new Error(
      "A valid model year is required. Example: node scripts/scrape-propain.js 2025"
    );
  }

  const product = extractProductSchema($);
  const properties = getAdditionalProperties(product);
  const offer = getOffer(product);

  const { modelName, trimName } = splitModelAndTrim(product.name);

  const category =
    cleanText(properties.pa_terrain) ||
    cleanText(product.category)?.split(">").pop()?.trim() ||
    null;

  const availableSizes =
    cleanText(properties["pa_frame-size"])
      ?.split(",")
      .map((size) => size.trim())
      .filter(Boolean) || [];

  const baseSourceId =
    cleanText(product.sku) || slugify(`${modelName}-${trimName}`);

  return {
    rawProduct: product,

    brand: {
      name: "Propain",
      slug: "propain",
      country: "Germany",
      website_url: "https://www.propain-bikes.com",
    },

    model: {
      name: modelName,
      slug: slugify(modelName),
      category,
      description: cleanText(product.description),
      introduced_year: null,
      discontinued_year: null,
    },

    version: {
      year,
      trim_name: trimName,

      currency: cleanText(offer.priceCurrency) || "USD",
      msrp: parseNumber(offer.price),

      frame_material: determineFrameMaterial(
        properties["pa_frame-material"]
      ),

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

      image_url: getImageUrl(product),

      source_name: "Propain",
      source_record_id: slugify(`${baseSourceId}-${year}`),
      source_url: cleanText(offer.url) || url,

      status: "active",
      available_sizes: availableSizes,
    },
  };
}

module.exports = {
  scrapeProduct,
  splitModelAndTrim,
};