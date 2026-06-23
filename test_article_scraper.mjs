
import axios from "axios";
import * as cheerio from "cheerio";

async function fetchArticle() {
  const targetUrl = "https://theanalyst.com/articles/switzerland-vs-canada-prediction-world-cup-2026-match-preview";
  
  const { data: externalData } = await axios.get(targetUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  const $ext = cheerio.load(externalData);
  
  const paragraphs = [];
  $ext("p").each((i, el) => {
    const text = $ext(el).text().trim();
    if(text.length > 50) paragraphs.push(text);
  });
  console.log("Extracted Paragraphs:", paragraphs.length);
  console.log(paragraphs.slice(0, 3));
}
fetchArticle();

