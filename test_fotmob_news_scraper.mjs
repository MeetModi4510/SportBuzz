
import * as cheerio from "cheerio";
import axios from "axios";

async function verifyFotmobScraping() {
  console.log("Fetching https://www.fotmob.com/news...");
  try {
    const { data } = await axios.get("https://www.fotmob.com/news", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    const $ = cheerio.load(data);
    const nextDataStr = $("#__NEXT_DATA__").html();
    const nextData = JSON.parse(nextDataStr);
    
    // Check if world news with images is available
    const worldNews = nextData.props.pageProps.fallback["/api/worldnews?lang=en&page=1"];
    const hasImages = worldNews.every(item => item.imageUrl !== undefined);
    
    console.log("--- RESULT ---");
    console.log(`Successfully fetched news: ${worldNews.length} articles found.`);
    console.log(`Images fetched successfully: ${hasImages}`);
    if (worldNews.length > 0) {
      console.log(`Sample Image URL: ${worldNews[0].imageUrl}`);
      console.log(`Sample Article URL: https://www.fotmob.com${worldNews[0].page.url}`);
    }

    // Check if we can fetch "Show more" news (pagination)
    const page2Res = await axios.get("https://www.fotmob.com/api/worldnews?page=2", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    console.log(`Show More News (Page 2) fetched successfully: ${page2Res.data.length} articles found.`);
    
  } catch(e) {
    console.error("Error:", e.message);
  }
}
verifyFotmobScraping();

