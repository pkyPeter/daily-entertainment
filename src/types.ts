export interface NewsItem {
  link: string;
  headLine: string;
  publishDate: string;
  source: string;
  content: string;
  imageUrl: string;
  imageProvider: string;
  authorName: string;
  newsProvider: string;
  suggestLine?: string;
}

export interface NewsData {
  date: string;
  newsInfo: NewsItem[];
  generatedAt: string;
}

export type NewsStatus = 'unprocessed' | 'selected-pic' | 'selected-sta' | 'completed' | 'rejected';

export interface NewsStatusRecord {
  [newsId: string]: NewsStatus;
}

export interface TabInfo {
  id: NewsStatus;
  label: string;
  count: number;
}