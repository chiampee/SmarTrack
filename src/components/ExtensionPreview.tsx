import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Tag, CheckCircle2, Sparkles } from 'lucide-react'

export const ExtensionPreview: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const handleSave = () => {
    if (isSaving || showSuccess) return
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2500)
    }, 1200)
  }

  // Particle animation for magic save effect
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 360) / 6,
    delay: i * 0.05
  }))

  return (
    <div className="w-full flex justify-center px-2 sm:px-0">
      {/* Extension popup with glassmorphism and floating effect */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[360px] sm:max-w-[400px]"
      >
        {/* Gradient border effect */}
        <div className="absolute -inset-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-400/30 via-slate-200/50 to-blue-400/30 blur-[0.5px]" />
        
        {/* Main container with glassmorphism */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-900/15 overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-blue-50/30 pointer-events-none" />
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 px-4 sm:px-6 py-4 sm:py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-sm sm:text-lg">ST</span>
              </div>
              <div>
                <div className="font-semibold text-base sm:text-lg">Save to SmarTrack</div>
                <div className="text-blue-100 text-xs sm:text-sm">Capture Intelligence</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Page preview card */}
            <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-white border-2 border-slate-200"
                style={{
                  backgroundImage: 'url(https://www.google.com/s2/favicons?domain=economist.com&sz=64)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Fallback icon if favicon fails to load */}
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 hidden" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-1 line-clamp-2">Global Semiconductor Supply Chain Report 2026</div>
                <div className="text-xs text-slate-500 font-mono truncate">economist.com/reports/semiconductors</div>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-3 sm:space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Title</label>
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-blue-200 rounded-lg sm:rounded-xl text-slate-900 font-medium text-sm shadow-sm line-clamp-1">
                  Global Semiconductor Supply Chain Report 2026
                </div>
              </div>

              {/* Description with AI shimmer */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Description
                  <span className="ml-1.5 sm:ml-2 text-blue-600 font-normal normal-case">✨ AI</span>
                </label>
                <div className="relative">
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-600 text-xs sm:text-sm leading-relaxed shadow-sm line-clamp-3">
                    Strategic analysis of localized manufacturing trends and the impact of AI-driven demand on global logistics.
                  </div>
                  {/* AI shimmer overlay */}
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl ai-shimmer pointer-events-none" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Category</label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-900 font-medium text-sm flex items-center justify-between shadow-sm">
                    <span className="truncate">Market Intelligence</span>
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <button className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 hover:bg-slate-200 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-500 font-semibold transition-colors flex-shrink-0">
                    +
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Tags</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {['#SupplyChain', '#MacroTech', '#Logistics'].map((tag) => (
                    <span 
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-700 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium border border-blue-100"
                    >
                      <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button className="flex-1 px-3 sm:px-4 py-3 sm:py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-semibold transition-colors text-sm">
                Cancel
              </button>
              
              {/* Magic Save Button */}
              <motion.button
                onClick={handleSave}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onTouchStart={() => setIsHovering(true)}
                onTouchEnd={() => setIsHovering(false)}
                whileTap={{ scale: 0.98 }}
                className={`relative flex-1 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold overflow-hidden transition-all duration-300 text-sm ${
                  showSuccess 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                }`}
              >
                {/* Particle effects on hover */}
                <AnimatePresence>
                  {isHovering && !isSaving && !showSuccess && (
                    <>
                      {particles.map((particle) => (
                        <motion.div
                          key={particle.id}
                          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0.5],
                            x: Math.cos(particle.angle * Math.PI / 180) * 20,
                            y: Math.sin(particle.angle * Math.PI / 180) * 20 - 15,
                          }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{
                            duration: 0.8,
                            delay: particle.delay,
                            repeat: Infinity,
                            repeatDelay: 0.3
                          }}
                          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white/60 rounded-full pointer-events-none"
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>

                {/* Button content */}
                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Saving...</span>
                    </>
                  ) : showSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Saved!</span>
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    </>
                  ) : (
                    <span>Save Link</span>
                  )}
                </span>
              </motion.button>
            </div>

            <div className="text-center text-xs text-slate-400 hidden sm:block">
              Press ⌘/Ctrl + Enter to save
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
