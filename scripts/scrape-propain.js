const axios = require("axios");
const cheerio = require("cheerio");

async function main() {
  const { data: html } = await axios.get(
    "https://www.propain-bikes.com/us/bikes/tyee/"
  );

  const $ = cheerio.load(html);

  console.log("Page title:");
  console.log($("title").text());
}

main().catch(console.error);