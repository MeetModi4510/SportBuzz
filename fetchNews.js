
import axios from "axios";
import fs from "fs";

async function scrapeFotmob() {
  try {
    console.log("Fetching Page 1 (Main News with Images)...");
    const page1Res = await axios.get("https://www.fotmob.com/api/worldnews?page=1", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    console.log("Fetching Page 2 (See More News)...");
    const page2Res = await axios.get("https://www.fotmob.com/api/worldnews?page=2", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    // Fetch full article for the first item
    console.log("Fetching full article content (when clicked)...");
    const firstArticleUrl = page1Res.data[0].page.url;
    const articleRes = await axios.get(`https://www.fotmob.com${firstArticleUrl}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const output = {
      mainNewsWithImages: page1Res.data,
      seeMoreNews: page2Res.data,
      sampleArticleHtmlLength: articleRes.data.length,
      sampleArticleUrl: firstArticleUrl
    };

    fs.writeFileSync("fetched_fotmob_news.json", JSON.stringify(output, null, 2));
    console.log("Successfully fetched! Saved to fetched_fotmob_news.json");

  } catch (err) {
    console.error("Error fetching:", err.message);
  }
}

scrapeFotmob();

