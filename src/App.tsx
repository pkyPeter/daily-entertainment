import { useState, useEffect, useCallback } from 'react'
import type { NewsData, NewsStatus, NewsStatusRecord, TabInfo } from './types'
import { NewsCard } from './NewsCard'
import { fetchNewsData } from './api'
import { cn } from './tailwind'

function App() {
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState<NewsStatus>('unprocessed')
  const [newsStatusRecord, setNewsStatusRecord] = useState<NewsStatusRecord>({})
  const [showResetOptions, setShowResetOptions] = useState(false)

  // 從 localStorage 載入新聞狀態
  const loadNewsStatusFromStorage = useCallback((date: string): NewsStatusRecord => {
    try {
      const stored = localStorage.getItem(`newsStatus_${date}`)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('載入新聞狀態失敗:', error)
      return {}
    }
  }, [])

  // 保存新聞狀態到 localStorage
  const saveNewsStatusToStorage = (date: string, statusRecord: NewsStatusRecord) => {
    try {
      localStorage.setItem(`newsStatus_${date}`, JSON.stringify(statusRecord))
    } catch (error) {
      console.error('保存新聞狀態失敗:', error)
    }
  }

  // 生成新聞項目的唯一 ID
  const generateNewsId = (link: string, headLine: string): string => {
    return `${link.split('/').pop()}_${headLine.slice(0, 20).replace(/\s/g, '')}`
  }

  // 更新新聞狀態
  const updateNewsStatus = (newsId: string, newStatus: NewsStatus) => {
    const updatedRecord = {
      ...newsStatusRecord,
      [newsId]: newStatus
    }
    setNewsStatusRecord(updatedRecord)
    saveNewsStatusToStorage(selectedDate, updatedRecord)
  }

  // 清除指定日期的新聞狀態記錄
  const resetNewsStatusByDate = (date: string) => {
    if (window.confirm(`確定要清除 ${formatDateDisplay(date)} 的新聞狀態記錄嗎？此操作無法復原。`)) {
      try {
        // 清除指定日期的 localStorage 項目
        localStorage.removeItem(`newsStatus_${date}`)
        
        // 如果清除的是當前選中的日期，重置當前狀態
        if (date === selectedDate) {
          setNewsStatusRecord({})
          setCurrentTab('unprocessed')
        }
        
        alert(`${formatDateDisplay(date)} 的新聞狀態記錄已清除！`)
      } catch (error) {
        console.error('清除新聞狀態失敗:', error)
        alert('清除失敗，請再試一次。')
      }
    }
  }

  // 清除所有新聞狀態記錄
  const resetAllNewsStatus = () => {
    if (window.confirm('確定要清除所有新聞狀態記錄嗎？此操作無法復原。')) {
      try {
        // 清除所有以 newsStatus_ 開頭的 localStorage 項目
        const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith('newsStatus_'))
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // 重置當前狀態
        setNewsStatusRecord({})
        setCurrentTab('unprocessed')
        
        alert('所有新聞狀態記錄已清除！')
      } catch (error) {
        console.error('清除新聞狀態失敗:', error)
        alert('清除失敗，請再試一次。')
      }
    }
  }

  // 計算各 tab 的新聞數量
  const getTabCounts = (): TabInfo[] => {
    if (!newsData) return []
    
    const counts = {
      unprocessed: 0,
      'selected-pic': 0,
      'selected-sta': 0,
      completed: 0,
      rejected: 0
    }
    
    newsData.newsInfo.forEach(news => {
      const newsId = generateNewsId(news.link, news.headLine)
      const status = newsStatusRecord[newsId] || 'unprocessed'
      counts[status]++
    })
    
    return [
      { id: 'unprocessed', label: '未處理', count: counts.unprocessed },
      { id: 'selected-pic', label: '已選擇 (PIC)', count: counts['selected-pic'] },
      { id: 'selected-sta', label: '已選擇 (STA)', count: counts['selected-sta'] },
      { id: 'completed', label: '處理完畢', count: counts.completed },
      { id: 'rejected', label: '不採用', count: counts.rejected }
    ]
  }

  // 根據當前 tab 篩選新聞
  const getFilteredNews = () => {
    if (!newsData) return []
    
    return newsData.newsInfo.filter(news => {
      const newsId = generateNewsId(news.link, news.headLine)
      const status = newsStatusRecord[newsId] || 'unprocessed'
      return status === currentTab
    })
  }

  // 生成最近7天的日期列表
  const generateRecentDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  // 格式化日期顯示
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    const dateStr = date.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    if (dateStr === todayStr) {
      return '今天'
    } else if (dateStr === yesterdayStr) {
      return '昨天'
    } else {
      return date.toLocaleDateString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        weekday: 'short'
      })
    }
  }

  const loadNewsData = useCallback(async (date: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('嘗試載入新聞:', date)
      
      const data = await fetchNewsData(date, 'entertainment')
      
      if (!data) {
        throw new Error('無法載入新聞數據')
      }
      
      console.log('載入成功:', data)
      setNewsData(data)
      
      // 載入該日期的新聞狀態
      const statusRecord = loadNewsStatusFromStorage(date)
      setNewsStatusRecord(statusRecord)
    } catch (err) {
      console.error('載入新聞數據失敗:', err)
      setError(err instanceof Error ? err.message : '載入新聞數據時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [loadNewsStatusFromStorage])

  useEffect(() => {
    const dates = generateRecentDates()
    setAvailableDates(dates)
    setSelectedDate(dates[0]) // 預設選擇今天
    loadNewsData(dates[0])
  }, [loadNewsData])

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    loadNewsData(date)
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* 左側邊欄 */}
      <aside className="w-full lg:w-64 bg-white shadow-lg border-r border-gray-200 lg:fixed lg:h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">每日娛樂新聞</h1>
        </div>
        
        <nav className="p-4">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
            {availableDates.map((date, index) => (
              <button
                key={date}
                className={cn(
                  "flex-shrink-0 lg:w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center space-x-3",
                  selectedDate === date 
                    ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200"
                )}
                onClick={() => handleDateSelect(date)}
              >
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                  selectedDate === date 
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-medium whitespace-nowrap">{formatDateDisplay(date)}</span>
              </button>
            ))}
          </div>
        </nav>
        
        {/* 重置功能區 */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="space-y-2">
            {/* 清除當前日期按鈕 */}
            <button
              onClick={() => resetNewsStatusByDate(selectedDate)}
              className="w-full px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
              清除當前日期
            </button>
            
            {/* 展開/收合更多選項 */}
            <button
              onClick={() => setShowResetOptions(!showResetOptions)}
              className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
            >
              {showResetOptions ? '收合選項' : '更多清除選項'}
              <svg className={cn(
                "w-3 h-3 transition-transform duration-200",
                showResetOptions && "rotate-180"
              )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* 展開的選項 */}
            {showResetOptions && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {/* 清除指定日期 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">清除指定日期：</label>
                  <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                    {availableDates.map(date => (
                      <button
                        key={date}
                        onClick={() => resetNewsStatusByDate(date)}
                        className="text-left px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded border border-gray-100 transition-all duration-200"
                      >
                        {formatDateDisplay(date)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 清除所有記錄 */}
                <button
                  onClick={resetAllNewsStatus}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清除所有記錄
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主要內容區 */}
      <main className="flex-1 lg:ml-64">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 lg:p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">載入失敗</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => loadNewsData(selectedDate)} 
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {loading ? '載入中...' : '重新載入'}
              </button>
            </div>
          </div>
        )}

        {!loading && !error && newsData && (
          <>
            <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {formatDateDisplay(selectedDate)}
                </h2>
                <p className="text-gray-600 text-sm lg:text-base">
                  共 {newsData.newsInfo.length} 則新聞
                </p>
              </div>
              
              {/* 分類 Tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {getTabCounts().map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                      currentTab === tab.id
                        ? "bg-white text-blue-700 shadow-sm border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold",
                      currentTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-600"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </header>

            <div className="p-4 lg:p-8">
              <div className="space-y-6">
                {getFilteredNews()
                  .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
                  .map((news, index) => {
                    const newsId = generateNewsId(news.link, news.headLine)
                    const currentStatus = newsStatusRecord[newsId] || 'unprocessed'
                    return (
                      <NewsCard 
                        key={`${news.link}-${index}`} 
                        news={news} 
                        newsId={newsId}
                        currentStatus={currentStatus}
                        onStatusChange={updateNewsStatus}
                      />
                    )
                  })}
              </div>
              
              {getFilteredNews().length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    此分類暫無新聞
                  </h3>
                  <p className="text-gray-500">
                    {currentTab === 'unprocessed' && '所有新聞都已被處理'}
                    {currentTab === 'selected-pic' && '尚未選擇任何 PIC 新聞'}
                    {currentTab === 'selected-sta' && '尚未選擇任何 STA 新聞'}
                    {currentTab === 'completed' && '尚未完成任何新聞的處理'}
                    {currentTab === 'rejected' && '尚未拒絕任何新聞'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {!loading && !error && (!newsData || newsData.newsInfo.length === 0) && (
          <div className="p-4 lg:p-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-600 mb-2">暫無新聞</h2>
              <p className="text-gray-500">選擇的日期暫無娛樂新聞數據</p>
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <footer className="bg-white border-t border-gray-200 px-4 lg:px-8 py-4">
          <p className="text-sm text-gray-500 text-center">
            Data Source: AI Automated Collection & Analysis
            {newsData && (
              <span> • Last Updated: {new Date(newsData.generatedAt).toLocaleString('en-US')}</span>
            )}
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
