import { chromium } from "playwright";
import fs from "fs";

async function scrapeYahooEntertainment() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🔍 開始爬取 Yahoo 娛樂新聞...");
  await page.goto("https://tw.news.yahoo.com/entertainment/");

  // 抓出上方有的連結
  const topLinks = await page.$$eval("#Col1-1-Hero-Proxy a", (as) =>
    as
      .map((a) => a.href)
      .filter(
        (href) => href.includes("tw.news.yahoo.com") && href.includes("html")
      )
  );
  // 抓出所有新聞連結：下方的更多娛樂新聞
  const moreLinks = await page.$$eval("#YDC-Stream a", (as) =>
    as
      .map((a) => a.href)
      .filter(
        (href) => href.includes("tw.news.yahoo.com") && href.includes("html")
      )
  );

  const links = topLinks.concat(moreLinks);
  console.log(`找到 ${links.length} 則新聞連結`);

  const results = [];
  for (const link of links.slice(0, 20)) {
    await page.goto(link, { waitUntil: "domcontentloaded" });

    // 檢查來源是否為 Yahoo 自製
    const source = await page
      .$eval('article[id^="article-"] script[type="application/ld+json"]', (el) =>
        el.textContent.trim()
      )
      .catch(() => "");
    
    const jsonValue = source ? JSON.parse(source) : null;
    const authorName = jsonValue?.author?.name || "";
    if (!authorName.toLowerCase().includes("yahoo")) continue;


    // 抓標題
    const headLine = jsonValue?.headline || "";
    if (!headLine) continue;



    // 過濾敏感關鍵字
    const content = await page.$eval("article[id^='article-']", (el) => el.textContent).catch(() => "");
    if (/(AV|性侵|犯罪|逮捕)/.test(content)) continue;

    // 圖片
    const imgNode = await page
      .$eval("article img")
      .catch(() => null);

    const figcaptionNode = imgNode?.nextSibling;
    const imageUrl = imgNode ? imgNode.src : "";

    results.push({
      link,
      source,
      content,
      imageUrl,
      imageProvider: figcaptionNode ? figcaptionNode.textContent.trim() : "",
    });

    if (results.length >= 10) break;
  }

  await browser.close();

  fs.writeFileSync("output.json", JSON.stringify(results, null, 2));
  console.log("✅ 已產出 10 則新聞：output.json");
}

scrapeYahooEntertainment();
