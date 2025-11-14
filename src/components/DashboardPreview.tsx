import React, { useEffect, useState } from 'react'
import { BookOpen, Search, Star, Archive, Clock, BarChart3, Settings, TrendingUp, Link2 } from 'lucide-react'

export const DashboardPreview: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in on mount
    setIsVisible(true)
  }, [])

  return (
    <div 
      className="bg-slate-900 text-white rounded-lg shadow-2xl relative w-full"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-blue-900/5 animate-pulse pointer-events-none"></div>
      
      <div className={`flex w-full relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Left Sidebar */}
        <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-800/95 border-r border-slate-700/50 flex flex-col backdrop-blur-sm">
          {/* User Profile */}
          <div className="p-6 border-b border-slate-700/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 group-hover:via-blue-500/10 transition-all duration-500"></div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 animate-pulse" style={{ animationDuration: '3s' }}>
                U
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">User</div>
                <div className="text-xs text-slate-400">user@example.com</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Navigation</div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 rounded-lg mb-2 border border-blue-500/20 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] group">
              <BarChart3 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-sm font-medium">Dashboard</span>
            </div>
          </div>

          {/* Projects */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Projects</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 rounded text-sm transition-all duration-300 hover:translate-x-1 group cursor-pointer">
                <BarChart3 className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                <span className="group-hover:text-white transition-colors">Show All Links</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 rounded text-sm transition-all duration-300 hover:translate-x-1 group cursor-pointer">
                <Star className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                <span className="group-hover:text-white transition-colors">Favorites</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 rounded text-sm transition-all duration-300 hover:translate-x-1 group cursor-pointer">
                <Clock className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                <span className="group-hover:text-white transition-colors">Recent (Last 7 days)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 rounded text-sm transition-all duration-300 hover:translate-x-1 group cursor-pointer">
                <Archive className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                <span className="group-hover:text-white transition-colors">Archived</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-t border-slate-700/50 flex-1">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Categories</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-1.5 text-slate-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 rounded text-sm transition-all duration-300 hover:translate-x-1 group cursor-pointer border border-transparent hover:border-purple-500/20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 group-hover:text-purple-400 group-hover:rotate-12 transition-all duration-300" />
                  <span className="group-hover:text-white transition-colors">Technology</span>
                </div>
                <span className="text-xs text-slate-500 group-hover:text-purple-400 font-semibold transition-colors">2</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 text-slate-300 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 rounded text-sm transition-all duration-300 hover:translate-x-1 group cursor-pointer border border-transparent hover:border-blue-500/20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 group-hover:text-blue-400 group-hover:rotate-12 transition-all duration-300" />
                  <span className="group-hover:text-white transition-colors">Business</span>
                </div>
                <span className="text-xs text-slate-500 group-hover:text-blue-400 font-semibold transition-colors">1</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 rounded text-sm transition-all duration-300 hover:translate-x-1 group cursor-pointer">
              <Settings className="w-4 h-4 group-hover:text-blue-400 group-hover:rotate-90 transition-all duration-300" />
              <span className="group-hover:text-white transition-colors">Settings</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/50 min-w-0 overflow-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-blue-500/0 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent animate-gradient-x">
                  Research Dashboard
                </h1>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-blue-400" />
                    3 links
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    1 favorites
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg text-sm flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group">
                  <TrendingUp className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                  Export
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white rounded-lg text-sm flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 group relative overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                  <Link2 className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10 font-semibold">+ Add Link</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search your research library..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:border-slate-600"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Filters
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Technology Category */}
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Technology</h2>
                <span className="text-sm text-slate-400 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  2 links
                </span>
              </div>
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:scale-[1.01] group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-start gap-3 relative z-10">
                    <input type="checkbox" className="mt-1 accent-blue-500" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1 flex items-center gap-2 group-hover:text-blue-200 transition-colors">
                            Understanding Modern Web Development
                            <Link2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:rotate-12 transition-all duration-300" />
                          </h3>
                          <p className="text-xs text-slate-400 mb-2">https://example.com/web-dev-guide</p>
                          <p className="text-sm text-slate-300 mb-2">A comprehensive guide to modern web development practices and frameworks.</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded text-xs border border-purple-500/30">Technology</span>
                            <span className="text-xs text-slate-500">Jan 15, 2025</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700/50 rounded-lg p-4 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 transform hover:scale-[1.01] group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-start gap-3 relative z-10">
                    <input type="checkbox" className="mt-1 accent-purple-500" />
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-600 rounded flex-shrink-0 border border-slate-600 group-hover:border-purple-500/30 transition-colors"></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1 flex items-center gap-2 group-hover:text-purple-200 transition-colors">
                            AI-Powered Research Tools
                            <Link2 className="w-4 h-4 text-slate-400 group-hover:text-purple-400 group-hover:rotate-12 transition-all duration-300" />
                          </h3>
                          <p className="text-xs text-slate-400 mb-2">https://example.com/ai-research</p>
                          <p className="text-sm text-slate-300 mb-2">Exploring the latest AI tools for research and knowledge management.</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded text-xs border border-purple-500/30">Technology</span>
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
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Business</h2>
                <span className="text-sm text-slate-400 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  1 link
                </span>
              </div>
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:scale-[1.01] group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-start gap-3 relative z-10">
                  <input type="checkbox" className="mt-1 accent-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1 flex items-center gap-2 group-hover:text-blue-200 transition-colors">
                          Customer Success Strategies
                          <Link2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:rotate-12 transition-all duration-300" />
                        </h3>
                        <p className="text-xs text-slate-400 mb-2">https://example.com/customer-success</p>
                        <p className="text-sm text-slate-300 mb-2">Best practices for improving customer retention and satisfaction.</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded text-xs border border-blue-500/30">Business</span>
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

