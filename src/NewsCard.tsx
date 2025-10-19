import React, { useState } from 'react';
import type { NewsItem } from './types';

interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        {/* 主要內容 */}
        <div className="flex-1 min-w-0">
          {/* 標題 */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
            <a 
              href={news.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              {news.headLine}
            </a>
          </h2>
          
          {/* 發布時間 */}
          <div className="mb-3">
            <time className="text-xs text-gray-500 font-medium">
              {formatDate(news.publishDate)}
            </time>
          </div>
          
          {/* 可收合的內容 */}
          <div className="mb-3">
            <p className="text-gray-600 text-sm leading-relaxed">
              {isExpanded ? news.content : truncateContent(news.content)}
            </p>
            {news.content.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 flex items-center"
              >
                {isExpanded ? (
                  <>
                    收合
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    展開全文
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* 閱讀全文連結 */}
          <a 
            href={news.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            閱讀原文
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        
        {/* 右側圖片區域 */}
        {news.imageUrl && (
          <div className="flex-shrink-0 text-center">
            <img 
              src={news.imageUrl} 
              alt={news.headLine}
              className="w-20 h-20 object-cover rounded-lg mb-2"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            {news.imageProvider && (
              <div className="text-xs text-gray-500 italic max-w-20 leading-tight">
                圖片來源: {news.imageProvider}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};