import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MasonryGrid } from './MasonryGrid'
import { useNavigate } from 'react-router-dom'

export const SanctuaryCard: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const navigate = useNavigate()

  const handleExploreClick = () => {
    setIsTransitioning(true)
    // Small delay to allow scale animation to start
    setTimeout(() => {
      navigate('/dashboard')
    }, 300)
  }

  return (
    <motion.div
      className="relative bg-white rounded-[3rem] p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: isTransitioning ? 1 : 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isTransitioning ? 1.1 : 1,
        borderRadius: isTransitioning ? '0.75rem' : '3rem',
      }}
      transition={{
        duration: isTransitioning ? 0.4 : 0.5,
        delay: isTransitioning ? 0 : 0.1,
        ease: isTransitioning ? 'easeInOut' : 'easeOut',
      }}
      layoutId="sanctuary-card"
    >
      {/* Masonry grid preview */}
      <div className="relative mb-6 h-48 rounded-2xl overflow-hidden backdrop-blur-md bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{
            y: isHovered ? 10 : 0,
            transition: {
              duration: 0.4,
              ease: 'easeOut',
            },
          }}
        >
          <MasonryGrid isHovered={isHovered} />
        </motion.div>
      </div>

      {/* Card content */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-slate-900">Enter Your Sanctuary</h3>
        <p className="text-slate-600 text-lg leading-relaxed">
          Navigate your library and find your next breakthrough.
        </p>
        <motion.button
          onClick={handleExploreClick}
          className="w-full border-2 border-slate-300 text-slate-700 py-4 rounded-xl font-semibold text-base hover:border-slate-400 hover:bg-slate-50 transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Explore Library
        </motion.button>
      </div>
    </motion.div>
  )
}
