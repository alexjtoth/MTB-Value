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

module.exports = {
  slugify,
  cleanText,
  parseNumber,
  normalizeRowName,
};