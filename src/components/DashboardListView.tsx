import React from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Download, 
  LayoutGrid,
  Star,
  Clock,
  Archive,
  Settings,
  BarChart3,
  FolderPlus,
  CheckSquare
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export const DashboardListView = () => {
  return (
    <div className="w-full bg-white rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 shadow-lg">
      {/* Header with gradient */}
      <div className="h-12 sm:h-14 lg:h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center px-4">
        <h2 className="text-white font-bold text-sm sm:text-base lg:text-lg truncate">Research Dashboard</h2>
      </div>

      <div className="flex h-[400px] sm:h-[450px] lg:h-[500px] overflow-hidden">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex w-56 bg-slate-100 border-r border-slate-200 flex-col flex-shrink-0 overflow-y-auto">
          {/* Navigation */}
          <div className="p-4 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm cursor-pointer">
              <LayoutGrid className="w-4 h-4" />
              Dashboard
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm cursor-pointer">
              <Search className="w-4 h-4" />
              Show All Links
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm cursor-pointer">
              <Star className="w-4 h-4" />
              Favorites
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm cursor-pointer">
              <Clock className="w-4 h-4" />
              Recent (Last 7 days)
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm cursor-pointer">
              <Archive className="w-4 h-4" />
              Archived
            </div>
          </div>

          {/* Projects Section */}
          <div className="px-4 py-2 border-t border-slate-200">
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm cursor-pointer mb-2">
              <FolderPlus className="w-4 h-4" />
              <span className="font-medium">+ Create New Project</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">
              <LayoutGrid className="w-4 h-4" />
              articles
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-auto px-4 py-2 border-t border-slate-200 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm cursor-pointer">
              <Settings className="w-4 h-4" />
              Settings
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm cursor-pointer">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white flex flex-col min-w-0 overflow-hidden w-full">
          {/* Top Bar */}
          <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                <span className="font-medium">2 links</span>
                <span>0 favorites</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button className="px-2 sm:px-3 py-1 sm:py-1.5 border border-slate-300 rounded-md sm:rounded-lg text-xs sm:text-sm text-slate-700 hover:bg-slate-100 active:bg-slate-200 flex items-center gap-1 sm:gap-2 whitespace-nowrap touch-manipulation">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-blue-600 text-white rounded-md sm:rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 active:bg-blue-800 flex items-center gap-1 sm:gap-2 whitespace-nowrap touch-manipulation">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">+ Add Link</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search your research library..."
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-white border border-slate-300 rounded-md sm:rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>
          </div>

          {/* List Header */}
          <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 border-b border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm sm:text-base text-slate-900">articles</h3>
              <span className="text-xs sm:text-sm text-slate-500">2 links</span>
            </div>
          </div>

          {/* Articles List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 min-h-0">
            {/* Article 1 */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white border border-slate-200 rounded-md sm:rounded-lg hover:border-blue-300 hover:shadow-sm transition-all min-w-0"
            >
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="font-medium text-slate-900 text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2 sm:truncate">
                    Friday stocks by analyst calls like Nvidia
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 truncate">
                    https://www.cnbc.com/2005/11/21/friday-stocks-by-analyst-calls-like-nvidia.html
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 flex-shrink-0">
                <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap">
                  articles
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                  Nov 20, 2005
                </div>
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-100 rounded flex-shrink-0 hidden sm:block" />
              </div>
            </motion.div>

            {/* Article 2 */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white border border-slate-200 rounded-md sm:rounded-lg hover:border-blue-300 hover:shadow-sm transition-all min-w-0"
            >
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="font-medium text-slate-900 text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2 sm:truncate">
                    CNBC Pro-Premium Lhe...
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 truncate">
                    https://www.cnbc.com/pro/
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 flex-shrink-0">
                <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap">
                  articles
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                  Nov 22, 2025
                </div>
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-100 rounded flex-shrink-0 hidden sm:block" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
