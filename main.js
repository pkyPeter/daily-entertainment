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

  console.log("� 滾動頁面載入更多新聞...");
  // 滾動到底部兩次以載入更多新聞
  for (let i = 1; i <= 2; i++) {
    console.log(`🔄 第 ${i} 次滾動到底部`);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    // 等待新內容載入
    await page.waitForTimeout(2000);
  }

  console.log("�📄 抓取新聞連結...");
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

  // 抓出所有新聞連結：日韓新聞
  const jpKrLinksWithoutDomain = await page.$$eval("#Main a", (as) =>
    as.map((a) => a.href).filter((href) => href.includes("html"))
  );
  const jpKrLins = jpKrLinksWithoutDomain.map((href) =>
    href.includes("tw.news.yahoo.com")
      ? href
      : `https://tw.news.yahoo.com${href}`
  );

  console.log(
    `分別找到 ${topLinks.length} 則上方新聞連結 和 ${moreLinks.length} 則更多新聞連結 和 ${jpKrLins.length} 則日韓新聞連結`
  );
  const allLinks = topLinks.concat(moreLinks).concat(jpKrLins);
  console.log(`合併後找到 ${allLinks.length} 則新聞連結`);

  // 去除重複的連結
  const links = [...new Set(allLinks)];
  console.log(`去重後剩餘 ${links.length} 則新聞連結`);

  const results = [];
  for (const link of links) {
    await new Promise((r) => setTimeout(r, 1000)); // 每則新聞間隔2秒
    if (results.length >= 20) break;

    console.log(`🔗 處理新聞：${link}`);
    try {
      await page.goto(link, { waitUntil: "domcontentloaded" });
    } catch (error) {
      console.error(`❌ 無法載入頁面 ${link} ：`, error.message);
      continue;
    }

    // 檢查來源是否為 Yahoo 自製
    const source = await page
      .$eval(
        'article[id^="article-"] script[type="application/ld+json"]',
        (el) => el.textContent.trim()
      )
      .catch(() => "");

    const jsonValue = source ? JSON.parse(source) : null;
    const authorName = jsonValue?.author?.name || "";
    const newsProvider = jsonValue?.provider?.name || "";

    console.log(`📝 新聞來源作者：${authorName}`);
    if (
      authorName.toLowerCase().includes("yahoo") ||
      newsProvider.toLowerCase().includes("yahoo")
    )
      continue;

    // 檢查是否為今日下午2點之後的新聞
    const now = new Date();

    // 獲取台灣時間的今日日期字串
    const twTime = now.toLocaleString("en-US", {
      timeZone: "Asia/Taipei",
    });
    const todayDateStr = new Date(twTime).toISOString().split("T")[0];

    // 創建台灣時間今日下午2點的 UTC 時間戳
    const today2PMTaiwan = new Date(`${todayDateStr}T14:00:00+08:00`);

    const datePublished = jsonValue?.datePublished || "";
    if (!datePublished) continue;

    const publishDate = new Date(datePublished);
    const publishDateStr = publishDate.toISOString().split("T")[0];

    console.log(
      `📅 發佈日期：${publishDateStr} ${publishDate.toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
      })}`
    );
    console.log(
      `⏰ 台灣時間今日下午2點：${today2PMTaiwan.toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
      })}`
    );

    // 檢查是否為今日且在下午2點之後 (以台灣時間為準)
    if (publishDateStr !== todayDateStr) continue;
    if (publishDate < today2PMTaiwan) {
      console.log(`⏰ 新聞發佈時間早於台灣時間今日下午2點，跳過`);
      continue;
    }

    // 抓標題
    const headLine = jsonValue?.headline || "";
    console.log(`📰 標題：${headLine}`);

    if (!headLine) continue;

    // 檢查標題前7個字是否與已收集的新聞重複
    const headLinePrefix = headLine.substring(0, 7);
    const isDuplicate = results.some((existingNews) => {
      const existingPrefix = existingNews.headLine.substring(0, 7);
      return existingPrefix === headLinePrefix;
    });

    if (isDuplicate) {
      console.log(`🔄 標題前7個字重複，跳過：${headLinePrefix}`);
      continue;
    }

    // 過濾敏感關鍵字
    const content = await page
      .$eval("article[id^='article-'] script ~ div", (el) => el.textContent)
      .catch(() => "");

    console.log(`📰 內容：${content}`);
    if (/(AV|性侵|犯罪|逮捕)/.test(content)) continue;

    // 圖片
    const imageUrl = await page
      .$eval("article[id^='article-'] script ~ div img", (el) => {
        return el.src;
      })
      .catch(() => null);
    const imageProvider = await page
      .$eval("article[id^='article-'] script ~ div img ~ figcaption", (el) => {
        return el.textContent.trim();
      })
      .catch(() => null);
    console.log(`🖼️ 圖片網址：${imageUrl}`);
    console.log(`🏷️ 圖片提供者：${imageProvider}`);

    results.push({
      link,
      headLine,
      publishDate: datePublished,
      source,
      content,
      imageUrl,
      imageProvider,
      authorName,
      newsProvider,
    });

    if (results.length >= 10) break;
  }

  await browser.close();

  // 儲存結果到 JSON 檔案
  await saveToJsonFile(results);

  console.log("✅ 已產出 10 則新聞：output.json");
}

scrapeYahooEntertainment();
