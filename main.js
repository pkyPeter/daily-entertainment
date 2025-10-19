import { chromium } from "playwright";
import fs from "fs";
import path from "path";


async function saveToJsonFile(newsInfo) {
  try {
    // 創建 docs/json 目錄（如果不存在）
    const docsDir = path.join(process.cwd(), "docs", "json");
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // 生成檔名：YYYY-MM-DD.json
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `${dateStr}.json`;
    const filePath = path.join(docsDir, fileName);

    // 準備要保存的資料
    const data = {
      date: dateStr,
      newsInfo,
      generatedAt: new Date().toISOString(),
    };

    // 寫入檔案
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`✅ 資料已保存到: ${fileName}`);

    return filePath;
  } catch (error) {
    console.error("❌ 保存檔案時發生錯誤:", error.message);
    throw error;
  }
}

async function scrapeYahooEntertainment() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🔍 開始爬取 Yahoo 娛樂新聞...");
  await page.goto("https://tw.news.yahoo.com/entertainment/", {
    waitUntil: "domcontentloaded",
    timeout: 60000, // 可加長 timeout
  });

  console.log("📄 抓取新聞連結...");
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
  for (const link of links) {
    if (results.length >= 10) break;
    
    console.log(`🔗 處理新聞：${link}`);
    await page.goto(link, { waitUntil: "domcontentloaded" });

    // 檢查來源是否為 Yahoo 自製
    const source = await page
      .$eval(
        'article[id^="article-"] script[type="application/ld+json"]',
        (el) => el.textContent.trim()
      )
      .catch(() => "");

    const jsonValue = source ? JSON.parse(source) : null;
    const authorName = jsonValue?.author?.name || "";

    console.log(`📝 新聞來源作者：${authorName}`);
    if (authorName.toLowerCase().includes("yahoo")) continue;

    // 檢查是否為今日的新聞
    const twTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" });
    const todayDateStr = new Date(twTime).toISOString().split("T")[0];

    const datePublished = jsonValue?.datePublished || "";
    const publishDateStr = datePublished
      ? new Date(datePublished)
          .toISOString()
          .split("T")[0]
      : null;

    console.log(`📅 發佈日期：${publishDateStr}`);
    if (publishDateStr !== todayDateStr) continue;

    // 抓標題
    const headLine = jsonValue?.headline || "";
    console.log(`📰 標題：${headLine}`);
    
    if (!headLine) continue;

    // 過濾敏感關鍵字
    const content = await page
      .$eval("article[id^='article-'] script ~ div", (el) => el.textContent)
      .catch(() => "");

    console.log(`📰 內容：${content}`);
    if (/(AV|性侵|犯罪|逮捕)/.test(content)) continue;

    // 圖片
    const imageUrl = await page.$eval("article[id^='article-'] script ~ div img", el => {
      return el.src;
    }).catch(() => null);
    const imageProvider = await page.$eval("article[id^='article-'] script ~ div img ~ figcaption", el => {
      return el.textContent.trim();
    }).catch(() => null);
    console.log(`🖼️ 圖片網址：${imageUrl}`);
    console.log(`🏷️ 圖片提供者：${imageProvider}`);

    results.push({
      link,
      headLine,
      publishDate: new Date(datePublished).toLocaleString("zh-TW"),
      source,
      content,
      imageUrl,
      imageProvider,
    });

    if (results.length >= 10) break;
  }

  await browser.close();

  // 儲存結果到 JSON 檔案
  await saveToJsonFile(results);

  console.log("✅ 已產出 10 則新聞：output.json");
}

scrapeYahooEntertainment();
