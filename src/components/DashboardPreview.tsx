import React from 'react'
import { BookOpen, Search, Star, Archive, Clock, BarChart3, Settings, TrendingUp, Link2, Tag } from 'lucide-react'

export const DashboardPreview: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white rounded-lg overflow-hidden shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          {/* User Profile */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                U
              </div>
              <div>
                <div className="font-semibold text-white">User</div>
                <div className="text-xs text-slate-400">user@example.com</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Navigation</div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </div>
          </div>

          {/* Projects */}
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Projects</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-700/50 rounded text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Show All Links</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-700/50 rounded text-sm">
                <Star className="w-4 h-4" />
                <span>Favorites</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-700/50 rounded text-sm">
                <Clock className="w-4 h-4" />
                <span>Recent (Last 7 days)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-700/50 rounded text-sm">
                <Archive className="w-4 h-4" />
                <span>Archived</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-t border-slate-700 flex-1">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Categories</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-1.5 text-slate-300 hover:bg-slate-700/50 rounded text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Technology</span>
                </div>
                <span className="text-xs text-slate-500">2</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 text-slate-300 hover:bg-slate-700/50 rounded text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Business</span>
                </div>
                <span className="text-xs text-slate-500">1</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-700/50 rounded text-sm">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-slate-900">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Research Dashboard</h1>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>3 links</span>
                  <span>✩ 1 favorites</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Export
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  + Add Link
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your research library..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
                Filters
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Technology Category */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Technology</h2>
                <span className="text-sm text-slate-400">2 links</span>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-750 transition-colors">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                            Understanding Modern Web Development
                            <Link2 className="w-4 h-4 text-slate-400" />
                          </h3>
                          <p className="text-xs text-slate-400 mb-2">https://example.com/web-dev-guide</p>
                          <p className="text-sm text-slate-300 mb-2">A comprehensive guide to modern web development practices and frameworks.</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">Technology</span>
                            <span className="text-xs text-slate-500">Jan 15, 2025</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-750 transition-colors">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <div className="w-20 h-20 bg-slate-700 rounded flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                            AI-Powered Research Tools
                            <Link2 className="w-4 h-4 text-slate-400" />
                          </h3>
                          <p className="text-xs text-slate-400 mb-2">https://example.com/ai-research</p>
                          <p className="text-sm text-slate-300 mb-2">Exploring the latest AI tools for research and knowledge management.</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">Technology</span>
                            <span className="text-xs text-slate-500">Jan 12, 2025</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Category */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Business</h2>
                <span className="text-sm text-slate-400">1 link</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-750 transition-colors">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                          Customer Success Strategies
                          <Link2 className="w-4 h-4 text-slate-400" />
                        </h3>
                        <p className="text-xs text-slate-400 mb-2">https://example.com/customer-success</p>
                        <p className="text-sm text-slate-300 mb-2">Best practices for improving customer retention and satisfaction.</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">Business</span>
                          <span className="text-xs text-slate-500">Jan 10, 2025</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

