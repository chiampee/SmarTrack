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
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i * 360) / 8,
    delay: i * 0.05
  }))

  return (
    <div className="w-full flex justify-center">
      {/* Extension popup with glassmorphism and floating effect */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[420px]"
      >
        {/* Gradient border effect */}
        <div className="absolute -inset-[1px] rounded-[25px] bg-gradient-to-br from-blue-400/30 via-slate-200/50 to-blue-400/30 blur-[0.5px]" />
        
        {/* Main container with glassmorphism */}
        <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-900/15 overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-blue-50/30 pointer-events-none" />
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-lg">ST</span>
              </div>
              <div>
                <div className="font-semibold text-lg">Save to SmarTrack</div>
                <div className="text-blue-100 text-sm">Capture Intelligence</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6 space-y-5">
            {/* Page preview card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-start gap-4 p-4 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/60"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 text-sm mb-1">Global Semiconductor Supply Chain Report 2026</div>
                <div className="text-xs text-slate-500 font-mono">economist.com/reports/semiconductors</div>
              </div>
            </motion.div>

            {/* Form fields */}
            <div className="space-y-4">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                <div className="px-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-slate-900 font-medium shadow-sm">
                  Global Semiconductor Supply Chain Report 2026
                </div>
              </motion.div>

              {/* Description with AI shimmer */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Description
                  <span className="ml-2 text-blue-600 font-normal normal-case">✨ AI Generated</span>
                </label>
                <div className="relative">
                  <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 leading-relaxed shadow-sm">
                    Strategic analysis of localized manufacturing trends and the impact of AI-driven demand on global logistics.
                  </div>
                  {/* AI shimmer overlay */}
                  <div className="absolute inset-0 rounded-xl ai-shimmer pointer-events-none" />
                </div>
              </motion.div>

              {/* Category */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium flex items-center justify-between shadow-sm">
                    <span>Market Intelligence</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <button className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-semibold transition-colors">
                    +
                  </button>
                </div>
              </motion.div>

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {['#SupplyChain', '#MacroTech', '#Logistics'].map((tag, i) => (
                    <motion.span 
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.3 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Action buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="flex gap-3 pt-2"
            >
              <button className="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">
                Cancel
              </button>
              
              {/* Magic Save Button */}
              <motion.button
                onClick={handleSave}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex-1 px-4 py-3.5 rounded-xl font-semibold overflow-hidden transition-all duration-300 ${
                  showSuccess 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40'
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
                            x: Math.cos(particle.angle * Math.PI / 180) * 30,
                            y: Math.sin(particle.angle * Math.PI / 180) * 30 - 20,
                          }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{
                            duration: 1,
                            delay: particle.delay,
                            repeat: Infinity,
                            repeatDelay: 0.5
                          }}
                          className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/60 rounded-full pointer-events-none"
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>

                {/* Button glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={isHovering ? { x: ['100%', '-100%'] } : {}}
                  transition={{ duration: 0.8, repeat: isHovering ? Infinity : 0, repeatDelay: 0.5 }}
                />

                {/* Button content */}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Saving...</span>
                    </>
                  ) : showSuccess ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </motion.div>
                      <span>Saved!</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  ) : (
                    <span>Save Link</span>
                  )}
                </span>
              </motion.button>
            </motion.div>

            <div className="text-center text-xs text-slate-400">
              Press ⌘/Ctrl + Enter to save
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
