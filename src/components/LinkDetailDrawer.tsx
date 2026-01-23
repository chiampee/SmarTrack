import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { Link } from '../types/Link'

interface LinkDetailDrawerProps {
  link: Link | null
  isOpen: boolean
  onClose: () => void
}

export const LinkDetailDrawer: React.FC<LinkDetailDrawerProps> = ({ link, isOpen, onClose }) => {
  if (!link) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Link Details</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 leading-tight break-words">
                  {link.title}
                </h3>
              </div>

              {/* Notes */}
              {link.description && (
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {link.description}
                  </p>
                </div>
              )}

              {/* Open Link Button - Large and prominent */}
              <div className="pt-4">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="w-5 h-5" strokeWidth={2} />
                  Open Link
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
