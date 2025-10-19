import { useState, useEffect } from 'react'
import type { NewsData } from './types'
import { NewsCard } from './NewsCard'
import { fetchNewsData } from './api'

function App() {
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])

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

  const loadNewsData = async (date: string) => {
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
    } catch (err) {
      console.error('載入新聞數據失敗:', err)
      setError(err instanceof Error ? err.message : '載入新聞數據時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const dates = generateRecentDates()
    setAvailableDates(dates)
    setSelectedDate(dates[0]) // 預設選擇今天
    loadNewsData(dates[0])
  }, [])

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
                className={`flex-shrink-0 lg:w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                  selectedDate === date 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => handleDateSelect(date)}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                  selectedDate === date 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-medium whitespace-nowrap">{formatDateDisplay(date)}</span>
              </button>
            ))}
          </div>
        </nav>
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
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? '載入中...' : '重新載入'}
              </button>
            </div>
          </div>
        )}

        {!loading && !error && newsData && (
          <>
            <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                {formatDateDisplay(selectedDate)}
              </h2>
              <p className="text-gray-600 mt-1">
                共 {newsData.newsInfo.length} 則新聞
              </p>
            </header>

            <div className="p-4 lg:p-8">
              <div className="space-y-6">
                {newsData.newsInfo.map((news, index) => (
                  <NewsCard key={`${news.link}-${index}`} news={news} />
                ))}
              </div>
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
