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
}

export interface NewsData {
  date: string;
  newsInfo: NewsItem[];
  generatedAt: string;
}