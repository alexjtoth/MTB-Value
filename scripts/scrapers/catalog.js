const axios = require("axios");
const cheerio = require("cheerio");

const CATALOG_URL =
  "https://www.propain-bikes.com/us/products/bikes/";

async function getCatalogLinks() {
  const { data } = await axios.get(CATALOG_URL, {
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/148 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const $ = cheerio.load(data);
  const urls = new Set();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    const absoluteUrl = new URL(href, CATALOG_URL).href;
    const cleanUrl = absoluteUrl.split("?")[0].split("#")[0];

    if (
      cleanUrl.includes(
        "propain-bikes.com/us/product/bikes/"
      )
    ) {
      urls.add(cleanUrl);
    }
  });

  return [...urls].sort();
}

module.exports = {
  getCatalogLinks,
};