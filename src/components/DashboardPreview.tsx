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
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const DashboardPreview: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full"
    >
      {/* Gradient border effect */}
      <div className="absolute -inset-[1px] rounded-[25px] bg-gradient-to-br from-blue-400/20 via-slate-200/40 to-blue-400/20" />
      
      {/* Deep floating shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-2xl shadow-slate-900/10 pointer-events-none" />
      
      {/* Main container with glassmorphism */}
      <div className="relative rounded-2xl bg-white/95 backdrop-blur-xl border border-white/60 overflow-hidden">
        <div className="flex w-full">
          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hidden lg:block w-64 border-r border-slate-200/80 bg-slate-50/70 backdrop-blur-sm"
          >
            {/* User Profile */}
            <div className="px-5 py-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/20">
                  P
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Professional User</div>
                  <div className="text-xs text-slate-500 truncate">user@company.com</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="px-4 py-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Navigation</div>
              <div className="flex items-center gap-2.5 px-3 py-2 bg-blue-50/80 text-blue-700 rounded-xl border border-blue-100/80">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
            </div>

            {/* Projects */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="px-4 py-4 border-t border-slate-200/80"
            >
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Projects</div>
              <div className="space-y-1">
                {[
                  { name: 'Market Analysis', count: 12 },
                  { name: 'Technical Specifications', count: 8 },
                  { name: 'Competitive Intel', count: 5 },
                ].map((project, i) => (
                  <motion.div 
                    key={project.name}
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-white/80 rounded-lg text-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="group-hover:text-slate-900 transition-colors">{project.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{project.count}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Filters */}
            <div className="px-4 py-4 border-t border-slate-200/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Filters</div>
              <div className="space-y-1">
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-white/80 rounded-lg text-sm transition-all cursor-pointer"
                >
                  <Star className="w-4 h-4 text-slate-400" />
                  <span>Favorites</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-white/80 rounded-lg text-sm transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Recent (7 days)</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 bg-white/80 backdrop-blur-sm">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="px-6 py-5 border-b border-slate-200/80"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Search */}
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    readOnly
                    placeholder="Search your knowledge base..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/80 backdrop-blur-sm border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl text-slate-600 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    New Capture
                  </motion.button>
                </div>
              </div>

              {/* Title */}
              <div className="mt-4 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">All Captures</h1>
                <span className="text-sm font-medium text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full">25 items</span>
              </div>
            </motion.div>

            {/* Content List */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerChildren}
              className="p-6 bg-slate-50/50"
            >
              <div className="space-y-3">
                {[
                  {
                    title: 'Q1 Fintech Regulatory Compliance Framework',
                    domain: 'reuters.com',
                    summary: 'Comprehensive overview of new regulatory requirements for fintech companies operating in the EU market.',
                    category: 'Market Analysis',
                    date: 'Today',
                    starred: true
                  },
                  {
                    title: 'Next-Gen Encryption Standards for Cloud Infrastructure',
                    domain: 'ieee.org',
                    summary: 'Technical specifications for post-quantum cryptographic standards in enterprise cloud environments.',
                    category: 'Technical Specifications',
                    date: 'Yesterday',
                    starred: false
                  },
                  {
                    title: 'Modern SaaS GTM Strategies: A 2026 Perspective',
                    domain: 'hbr.org',
                    summary: 'Strategic analysis of go-to-market approaches for B2B SaaS companies in the current market.',
                    category: 'Competitive Intel',
                    date: 'Jan 10',
                    starred: true
                  },
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer group overflow-hidden"
                  >
                    {/* Subtle gradient border on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-400/10 via-transparent to-blue-400/10" />
                    </div>
                    
                    <div className="relative flex items-start gap-4">
                      {/* Favicon placeholder */}
                      <div className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-400 font-semibold text-sm uppercase group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        {item.domain.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {item.starred && (
                            <motion.div whileHover={{ scale: 1.2, rotate: 15 }}>
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="text-xs text-slate-400 mb-2">{item.domain}</div>
                        
                        {/* Summary with AI shimmer */}
                        <div className="relative mb-3">
                          <p className="text-sm text-slate-600 line-clamp-2">{item.summary}</p>
                          <div className="absolute inset-0 ai-shimmer pointer-events-none rounded" />
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100/80">
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
