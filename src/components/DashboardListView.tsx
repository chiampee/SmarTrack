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
    <div className="w-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-lg">
      {/* Header with gradient */}
      <div className="h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
        <h2 className="text-white font-bold text-lg">Research Dashboard</h2>
      </div>

      <div className="flex h-[500px]">
        {/* Left Sidebar */}
        <div className="w-56 bg-slate-100 border-r border-slate-200 flex flex-col">
          {/* Navigation */}
          <div className="p-4 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">
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
        <div className="flex-1 bg-white flex flex-col">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="font-medium">2 links</span>
                <span>0 favorites</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  + Add Link
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search your research library..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>
          </div>

          {/* List Header */}
          <div className="px-6 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">articles</h3>
              <span className="text-sm text-slate-500">2 links</span>
            </div>
          </div>

          {/* Articles List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {/* Article 1 */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <CheckSquare className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 text-sm mb-1">
                  Friday stocks by analyst calls like Nvidia
                </div>
                <div className="text-xs text-slate-500 truncate">
                  https://www.cnbc.com/2005/11/21/friday-stocks-by-analyst-calls-like-nvidia.html
                </div>
              </div>
              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex-shrink-0">
                articles
              </div>
              <div className="text-xs text-slate-500 flex-shrink-0 w-20 text-right">
                Nov 20, 2005
              </div>
              <div className="w-6 h-6 bg-slate-100 rounded flex-shrink-0" />
            </motion.div>

            {/* Article 2 */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <CheckSquare className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 text-sm mb-1">
                  CNBC Pro-Premium Lhe...
                </div>
                <div className="text-xs text-slate-500 truncate">
                  https://www.cnbc.com/pro/
                </div>
              </div>
              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex-shrink-0">
                articles
              </div>
              <div className="text-xs text-slate-500 flex-shrink-0 w-20 text-right">
                Nov 22, 2025
              </div>
              <div className="w-6 h-6 bg-slate-100 rounded flex-shrink-0" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
