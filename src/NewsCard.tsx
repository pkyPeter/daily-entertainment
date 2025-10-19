import React, { useState } from "react";
import type { NewsItem, NewsStatus } from "./types";
import { Button } from "./Button";

interface NewsCardProps {
  news: NewsItem;
  newsId?: string;
  currentStatus?: NewsStatus;
  onStatusChange?: (newsId: string, newStatus: NewsStatus) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  news, 
  newsId = '', 
  currentStatus = 'unprocessed', 
  onStatusChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullSuggest, setShowFullSuggest] = useState(false);

  // 解析 AI 建議句子
  const parseSuggestLines = (suggestLine: string) => {
    // 使用正則表達式匹配 **文字** 格式的句子
    const matches = suggestLine.match(/\*\*([^*]+)\*\*/g);
    if (matches) {
      return matches.map((match) => match.replace(/\*\*/g, "").trim());
    }

    // 如果沒有匹配到 ** 格式，嘗試按行分割
    const lines = suggestLine.split("\n").filter((line) => line.trim());
    const suggestions = lines
      .filter(
        (line) =>
          line.includes(".") && (line.includes("**") || line.match(/^\d+\./))
      )
      .map((line) =>
        line
          .replace(/^\d+\.\s*/, "")
          .replace(/\*\*/g, "")
          .trim()
      );

    return suggestions.length > 0 ? suggestions : [suggestLine.trim()];
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 簡單的成功提示，可以之後改成更好的 toast 通知
      alert(successMessage);
    } catch (err) {
      console.error("複製失敗:", err);
      alert("複製失敗，請手動複製");
    }
  };

  // 清理圖片來源文字，提取括號內的內容
  const cleanImageProvider = (imageProvider: string) => {
    // 使用正則表達式匹配 （圖／...） 或 (圖／...) 格式
    const match = imageProvider.match(/[（(]([^）)]*圖[／/][^）)]*)[）)]/);
    if (match) {
      return match[1]; // 返回括號內的內容（不包含括號）
    }

    // 如果沒有匹配到括號格式，尋找包含「圖／」的部分
    const imgMatch = imageProvider.match(/圖[／/][^，。]*[^，。]/);
    if (imgMatch) {
      return imgMatch[0];
    }

    // 如果都沒匹配到，返回原始文字
    return imageProvider;
  };

  const copyUrlWithNcid = async () => {
    const urlWithNcid = `${news.link}?ncid=facebook_twfbtracki_qycu9rbgk0q`;
    await copyToClipboard(urlWithNcid, "網址（含 NCID）已複製到剪貼簿");
  };

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName.substring(0, 50)}.jpg`; // 限制檔名長度
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("下載失敗:", err);
      alert("下載失敗，請嘗試右鍵另存圖片");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
      {/* 狀態管理區塊（置頂） */}
      {onStatusChange && (
        <div className="mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">狀態:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
              currentStatus === 'unprocessed' ? 'bg-gray-100 text-gray-600' :
              currentStatus === 'selected' ? 'bg-blue-100 text-blue-600' :
              currentStatus === 'completed' ? 'bg-green-100 text-green-600' :
              'bg-red-100 text-red-600'
            }`}>
              {currentStatus === 'unprocessed' ? '未處理' :
               currentStatus === 'selected' ? '已選擇' :
               currentStatus === 'completed' ? '處理完畢' :
               '不採用'}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {currentStatus === 'unprocessed' && (
              <>
                <Button
                  onClick={() => onStatusChange(newsId, 'selected')}
                  variant="blue"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                >
                  選擇
                </Button>
                <Button
                  onClick={() => onStatusChange(newsId, 'rejected')}
                  variant="red"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                >
                  不採用
                </Button>
              </>
            )}
            
            {currentStatus === 'selected' && (
              <>
                <Button
                  onClick={() => onStatusChange(newsId, 'completed')}
                  variant="green"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  處理完畢
                </Button>
                <Button
                  onClick={() => onStatusChange(newsId, 'unprocessed')}
                  variant="gray"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  }
                >
                  回到未處理
                </Button>
              </>
            )}
            
            {(currentStatus === 'completed' || currentStatus === 'rejected') && (
              <Button
                onClick={() => onStatusChange(newsId, 'unprocessed')}
                variant="gray"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                }
              >
                重新處理
              </Button>
            )}
          </div>
        </div>
      )}
      
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
                    <svg
                      className="ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </>
                ) : (
                  <>
                    展開全文
                    <svg
                      className="ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
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
            <svg
              className="ml-1 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>

          {/* 工具區 */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            {/* 基本工具按鈕 */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={copyUrlWithNcid}
                variant="gray"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
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
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    }
                  >
                    下載圖片
                  </Button>

                  <Button
                    onClick={() => {
                      const cleanedProvider = cleanImageProvider(
                        news.imageProvider || "圖片來源"
                      );
                      copyToClipboard(
                        cleanedProvider,
                        `圖片來源已複製到剪貼簿：${cleanedProvider}`
                      );
                    }}
                    variant="blue"
                    icon={
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    }
                  >
                    複製圖片來源
                  </Button>
                </>
              )}
            </div>
            {/* AI 建議引導句區塊（在工具區內） */}
            {news.suggestLine && (
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  AI 建議引導句
                </h4>

                {/* 解析後的建議句子列表 */}
                <div className="space-y-2 mb-3">
                  {parseSuggestLines(news.suggestLine).map(
                    (suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white bg-opacity-60 rounded-md p-2 border border-purple-100"
                      >
                        <span className="text-sm font-medium text-gray-800 flex-1">
                          {suggestion}
                        </span>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              suggestion,
                              `建議句 ${index + 1} 已複製到剪貼簿`
                            )
                          }
                          variant="blue"
                          icon={
                            <svg
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          }
                        >
                          複製
                        </Button>
                      </div>
                    )
                  )}
                </div>

                {/* 可收合的完整內容區塊 */}
                <div className="border-t border-purple-200 pt-2">
                  <button
                    onClick={() => setShowFullSuggest(!showFullSuggest)}
                    className="text-xs text-purple-700 hover:text-purple-900 font-medium flex items-center transition-colors duration-200"
                  >
                    {showFullSuggest ? "隱藏" : "查看"}完整 AI 建議引導句回應
                    <svg
                      className={`ml-1 w-3 h-3 transition-transform duration-200 ${
                        showFullSuggest ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showFullSuggest && (
                    <div className="mt-2 p-2 bg-white bg-opacity-40 rounded border border-purple-100 text-xs text-gray-600 whitespace-pre-line">
                      {news.suggestLine}
                    </div>
                  )}
                </div>
              </div>
            )}
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
            <p className="text-xs text-gray-500 text-center break-words">
              {news.imageProvider || "圖片來源"}
            </p>
          </div>
        )}
      </div>
    </article>
  );
};
