import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Globe } from 'lucide-react'

interface CaptureCardProps {
  onCaptureClick: () => void
}

export const CaptureCard: React.FC<CaptureCardProps> = ({ onCaptureClick }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="relative bg-white rounded-[3rem] p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Blurred browser window mockup */}
      <div className="relative mb-6 h-48 rounded-2xl overflow-hidden backdrop-blur-md bg-gradient-to-br from-slate-100 to-slate-200">
        {/* Browser chrome */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-300/50 backdrop-blur-sm flex items-center gap-2 px-3">
          <div className="w-3 h-3 rounded-full bg-red-400/60"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400/60"></div>
          <div className="w-3 h-3 rounded-full bg-green-400/60"></div>
          <div className="flex-1 mx-3 h-4 bg-white/40 rounded backdrop-blur-sm"></div>
        </div>

        {/* Floating Capture button */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: isHovered ? 1.1 : 1,
            transition: { duration: 0.3 },
          }}
        >
          <motion.button
            className="relative z-10 bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: isHovered
                ? '0 0 30px rgba(37, 99, 235, 0.6), 0 0 60px rgba(37, 99, 235, 0.3)'
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles className="w-5 h-5" />
            Capture
          </motion.button>
        </motion.div>

        {/* Subtle content blur effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20"></div>
      </div>

      {/* Card content */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-slate-900">Capture a Discovery</h3>
        <p className="text-slate-600 text-lg leading-relaxed">
          Turn a tab into a permanent resource in 1 click.
        </p>
        <motion.button
          onClick={onCaptureClick}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Capture Now
        </motion.button>
      </div>
    </motion.div>
  )
}
