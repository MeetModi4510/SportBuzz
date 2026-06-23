
import axios from "axios";
import * as cheerio from "cheerio";

async function getFootballNewsArticle(url) {
    if (!url) return [];

    try {
        const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };
        let targetUrl = url.startsWith("/") ? `https://www.fotmob.com${url}` : url;

        // If it"s a FotMob embed URL, we need to extract the actual external source URL
        if (targetUrl.includes("fotmob.com/embed/news/")) {
            try {
                const { data: embedData } = await axios.get(targetUrl, { headers, timeout: 8000 });
                const $ = cheerio.load(embedData);
                const nextDataStr = $("#__NEXT_DATA__").html();
                if (nextDataStr) {
                    const nextData = JSON.parse(nextDataStr);
                    if (nextData.props?.pageProps?.data?.src) {
                        targetUrl = nextData.props.pageProps.data.src;
                    }
                }
            } catch (e) {
                console.warn("[Football News Article] Failed to unwrap FotMob embed URL", e.message);
            }
        }

        // Fetch the actual article (whether it"s the external site or direct link)
        const { data: articleHtml } = await axios.get(targetUrl, { headers, timeout: 8000 });
        const $ = cheerio.load(articleHtml);

        const paragraphs = [];
        $("p").each((i, el) => {
            const text = $(el).text().trim();
            // Filter out short UI elements, copyright notices, and generic nav text
            if (text.length > 50 && !text.toLowerCase().includes("copyright")) {
                paragraphs.push(text);
            }
        });

        return paragraphs;
    } catch (err) {
        console.error("[Football News Article] Error fetching article:", err.message);
        return [];
    }
}
getFootballNewsArticle("/embed/news/01kvryvdrhp3/usmnt-projected-starting-lineup").then(p => console.log(p.length)).catch(e => console.error(e));

