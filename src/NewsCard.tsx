import React, { useState } from 'react';
import type { NewsItem } from './types';
import { Button } from './Button';

interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 簡單的成功提示，可以之後改成更好的 toast 通知
      alert(successMessage);
    } catch (err) {
      console.error('複製失敗:', err);
      alert('複製失敗，請手動複製');
    }
  };

  const copyUrlWithNcid = async () => {
    const urlWithNcid = `${news.link}?ncid=facebook_twfbtracki_qycu9rbgk0q`;
    await copyToClipboard(urlWithNcid, '網址（含 NCID）已複製到剪貼簿');
  };

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.substring(0, 50)}.jpg`; // 限制檔名長度
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下載失敗:', err);
      alert('下載失敗，請嘗試右鍵另存圖片');
    }
  };

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
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
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
          
          {/* 發布時間與新聞來源 */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <time className="text-xs text-gray-500 font-medium">
              {formatDate(news.publishDate)}
            </time>
            {news.newsProvider && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-blue-600 font-medium">
                  {news.newsProvider}
                </span>
              </>
            )}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* AI 建議字串區塊 */}
          {news.suggestLine && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 建議引導句
              </h4>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {news.suggestLine}
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={() => copyToClipboard(news.suggestLine || '', 'AI 建議句已複製到剪貼簿')}
                  variant="blue"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  複製建議句
                </Button>
              </div>
            </div>
          )}

          {/* 工具區 */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={copyUrlWithNcid}
                variant="gray"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
              >
                複製網址（含ncid）
              </Button>

              {news.imageUrl && (
                <>
                  <Button
                    onClick={() => downloadImage(news.imageUrl, news.headLine)}
                    variant="green"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  >
                    下載圖片
                  </Button>

                  <Button
                    onClick={() => copyToClipboard(news.imageProvider || '圖片來源', '圖片來源已複製到剪貼簿')}
                    variant="blue"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  >
                    複製圖片來源
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* 右側圖片區域 */}
        {news.imageUrl && (
          <div className="w-80 flex flex-col items-center space-y-2">
            <img
              src={news.imageUrl}
              alt={news.headLine}
              className="max-w-72 max-h-72 object-contain rounded-lg mx-auto"
            />
            <p className="text-xs text-gray-500 text-center break-words">{news.imageProvider || '圖片來源'}</p>
          </div>
        )}
      </div>
    </article>
  );
};