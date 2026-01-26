import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CaptureCard } from '../components/CaptureCard'
import { SanctuaryCard } from '../components/SanctuaryCard'
import { AddLinkModal } from '../components/AddLinkModal'
import { useBackendApi } from '../hooks/useBackendApi'
import { useToast } from '../components/Toast'
import { Link } from '../types/Link'

export const LobbyPage: React.FC = () => {
  const [showCaptureModal, setShowCaptureModal] = useState(false)
  const backendApi = useBackendApi()
  const { makeRequest } = backendApi
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleCaptureClick = () => {
    setShowCaptureModal(true)
  }

  const handleSaveLink = async (linkData: Omit<Link, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'clickCount'>) => {
    try {
      // Use the backend API to save the link
      const savedLink = await makeRequest<Link>('/api/links', {
        method: 'POST',
        body: JSON.stringify({
          url: linkData.url,
          title: linkData.title,
          description: linkData.description,
          category: linkData.category,
          tags: linkData.tags,
          contentType: linkData.contentType,
          isFavorite: linkData.isFavorite,
          isArchived: linkData.isArchived,
          ...(linkData.collectionId && { collectionId: linkData.collectionId }),
        }),
      })

      if (savedLink) {
        showToast('success', 'Link captured successfully!')
        setShowCaptureModal(false)
        // Navigate to dashboard after saving
        setTimeout(() => {
          navigate('/dashboard')
        }, 500)
      }
    } catch (error) {
      console.error('Error saving link:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      showToast('error', `Failed to save link: ${errorMessage}`)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Subtle SmarTrack watermark */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='120' font-weight='900' text-anchor='middle' dominant-baseline='middle' fill='%23000000' font-family='system-ui, sans-serif'%3ESmarTrack%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 200px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero section */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="text-center mb-12 sm:mb-16 max-w-4xl mx-auto"
            variants={itemVariants}
          >
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-4 sm:mb-6"
              style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}
            >
              Move your research forward.
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 font-medium leading-relaxed">
              One space for everything you find. A visual sanctuary for everything you build.
            </p>
          </motion.div>

          {/* Dual-card grid */}
          <motion.div
            className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
            variants={itemVariants}
          >
            <CaptureCard onCaptureClick={handleCaptureClick} />
            <SanctuaryCard />
          </motion.div>
        </motion.div>

        {/* Sticky footer */}
        <motion.footer
          className="sticky bottom-0 w-full py-4 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-slate-500">
            <span>v1.0.0</span>
            <a
              href="https://www.producthunt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              Product Hunt Launch
            </a>
          </div>
        </motion.footer>
      </div>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        onSave={handleSaveLink}
        existingCategories={[]}
      />
    </div>
  )
}
