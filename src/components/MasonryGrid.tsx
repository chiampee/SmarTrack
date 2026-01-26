import React from 'react'
import { motion } from 'framer-motion'

interface MasonryGridProps {
  isHovered?: boolean
}

// Placeholder link data for a16z and Agentic AI content
const placeholderLinks = [
  { id: 1, title: 'The Future of AI Agents', height: 'h-32', color: 'bg-blue-50' },
  { id: 2, title: 'a16z: Agentic AI Landscape', height: 'h-24', color: 'bg-indigo-50' },
  { id: 3, title: 'Building Autonomous Systems', height: 'h-40', color: 'bg-purple-50' },
  { id: 4, title: 'Agent Frameworks Explained', height: 'h-28', color: 'bg-pink-50' },
  { id: 5, title: 'AI Research Papers', height: 'h-36', color: 'bg-cyan-50' },
  { id: 6, title: 'Agentic AI Tools', height: 'h-20', color: 'bg-amber-50' },
  { id: 7, title: 'Multi-Agent Systems', height: 'h-32', color: 'bg-emerald-50' },
  { id: 8, title: 'LLM Agent Patterns', height: 'h-28', color: 'bg-rose-50' },
]

export const MasonryGrid: React.FC<MasonryGridProps> = ({ isHovered = false }) => {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
      <motion.div
        className="grid grid-cols-2 gap-2 p-3"
        animate={{
          y: isHovered ? -5 : 0,
          transition: {
            duration: 0.3,
            ease: 'easeOut',
          },
        }}
      >
        {placeholderLinks.map((link) => (
          <motion.div
            key={link.id}
            className={`${link.height} ${link.color} rounded-lg p-3 backdrop-blur-md border border-white/20 shadow-sm`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: link.id * 0.05,
              duration: 0.3,
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="h-full flex flex-col justify-between">
              <div className="text-xs font-medium text-slate-700 line-clamp-2">
                {link.title}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <span className="text-[10px] text-slate-500">a16z</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
