import type { NewsData } from './types';

export async function fetchNewsData(date: string, configName: string = 'entertainment'): Promise<NewsData | null> {
  try {
    const fileName = `${date}.json`;  // 簡化檔名，只使用日期
    // 開發環境下使用本地檔案，生產環境使用 GitHub Pages
    const isDev = import.meta.env.DEV;
    const url = isDev 
      ? `/daily-entertainment/${fileName}`  // 開發環境：Vite 的 publicDir (docs) 映射到根路徑
      : `https://pkypeter.github.io/daily-entertainment/${fileName}`; // GitHub Pages 路徑
    
    console.log(`嘗試載入: ${url} (isDev: ${isDev})`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`無法載入 ${fileName}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data: NewsData = await response.json();
    return data;
  } catch (error) {
    console.error(`獲取 ${date}-${configName} 資料失敗:`, error);
    return null;
  }
}

// 獲取最近幾天的新聞數據
export async function fetchRecentNews(days: number = 7): Promise<NewsData[]> {
  const newsDataList: NewsData[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const data = await fetchNewsData(dateString, 'entertainment');
    if (data) {
      newsDataList.push(data);
    }
  }
  
  return newsDataList;
}