import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Clock, ExternalLink, Filter, FolderOpen, Plus, Search, Star } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
}

export const DashboardPreview: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full"
    >
      {/* Gradient border effect */}
      <div className="absolute -inset-[1px] rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400/20 via-slate-200/40 to-blue-400/20" />
      
      {/* Deep floating shadow */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl shadow-slate-900/10 pointer-events-none" />
      
      {/* Main container with glassmorphism */}
      <div className="relative rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-xl border border-white/60 overflow-hidden">
        <div className="flex w-full">
          {/* Sidebar - Hidden on mobile and tablet */}
          <div className="hidden lg:block w-56 xl:w-64 border-r border-slate-200/80 bg-slate-50/70 backdrop-blur-sm">
            {/* User Profile */}
            <div className="px-4 py-3 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20">
                  P
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Professional User</div>
                  <div className="text-xs text-slate-500 truncate">user@company.com</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="px-3 py-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Navigation</div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/80 text-blue-700 rounded-lg border border-blue-100/80">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
            </div>

            {/* Projects */}
            <div className="px-3 py-3 border-t border-slate-200/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Projects</div>
              <div className="space-y-1">
                {[
                  { name: 'Market Analysis', count: 12 },
                  { name: 'Technical Specs', count: 8 },
                  { name: 'Competitive Intel', count: 5 },
                ].map((project) => (
                  <div 
                    key={project.name}
                    className="flex items-center justify-between px-3 py-1.5 text-slate-600 hover:bg-white/80 rounded-lg text-sm cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{project.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{project.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="px-3 py-3 border-t border-slate-200/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filters</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-white/80 rounded-lg text-sm cursor-pointer">
                  <Star className="w-4 h-4 text-slate-400" />
                  <span>Favorites</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-white/80 rounded-lg text-sm cursor-pointer">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Recent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white/80 backdrop-blur-sm min-w-0">
            {/* Header */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    readOnly
                    placeholder="Search..."
                    className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-400 text-sm"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 sm:gap-3">
                  <button className="p-2 sm:p-2.5 bg-slate-100/80 rounded-lg text-slate-600 flex-shrink-0">
                    <Filter className="w-4 h-4" />
                  </button>
                  <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/20">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Capture</span>
                    <span className="sm:hidden">New</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">All Captures</h1>
                <span className="text-xs sm:text-sm font-medium text-slate-500 bg-slate-100/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">25</span>
              </div>
            </div>

            {/* Content List */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={staggerChildren}
              className="p-3 sm:p-4 md:p-6 bg-slate-50/50"
            >
              <div className="space-y-2 sm:space-y-3">
                {[
                  {
                    title: 'Q1 Fintech Regulatory Compliance Framework',
                    domain: 'reuters.com',
                    summary: 'Comprehensive overview of new regulatory requirements for fintech companies.',
                    category: 'Market Analysis',
                    date: 'Today',
                    starred: true
                  },
                  {
                    title: 'Next-Gen Encryption Standards for Cloud',
                    domain: 'ieee.org',
                    summary: 'Technical specifications for post-quantum cryptographic standards.',
                    category: 'Technical',
                    date: 'Yesterday',
                    starred: false
                  },
                  {
                    title: 'Modern SaaS GTM Strategies: 2026',
                    domain: 'hbr.org',
                    summary: 'Strategic analysis of go-to-market approaches for B2B SaaS.',
                    category: 'Strategy',
                    date: 'Jan 10',
                    starred: true
                  },
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                    className="relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 md:p-5 hover:border-blue-200 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Favicon placeholder */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100/80 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-slate-400 font-semibold text-xs sm:text-sm uppercase">
                        {item.domain.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </h3>
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                          </div>
                          {item.starred && (
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="text-xs text-slate-400 mb-1.5 sm:mb-2">{item.domain}</div>
                        
                        {/* Summary with AI shimmer */}
                        <div className="relative mb-2 sm:mb-3">
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{item.summary}</p>
                          <div className="absolute inset-0 ai-shimmer pointer-events-none rounded" />
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="text-xs font-medium text-blue-700 bg-blue-50/80 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg border border-blue-100/80">
                            {item.category}
                          </span>
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
