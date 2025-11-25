import React from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink } from 'lucide-react'

interface PasteDestinationModalProps {
  isOpen: boolean
  onClose: () => void
  linkCount: number
}

export const PasteDestinationModal: React.FC<PasteDestinationModalProps> = ({
  isOpen,
  onClose,
  linkCount
}) => {
  if (import.meta.env.DEV) {
    console.log('🎯 PasteDestinationModal render - isOpen:', isOpen, 'linkCount:', linkCount)
  }
  
  if (!isOpen) {
    if (import.meta.env.DEV) console.log('❌ Modal NOT rendering (isOpen is false)')
    return null
  }
  
  if (import.meta.env.DEV) console.log('✅ Modal RENDERING with Portal')

  const destinations = [
    {
      name: 'ChatGPT',
      icon: '🤖',
      url: 'https://chat.openai.com/',
      description: 'Paste into ChatGPT for analysis',
      color: 'from-green-500 to-emerald-600'
    },
    {
      name: 'Claude',
      icon: '🧠',
      url: 'https://claude.ai/',
      description: 'Paste into Claude for insights',
      color: 'from-orange-500 to-amber-600'
    },
    {
      name: 'Gemini',
      icon: '✨',
      url: 'https://gemini.google.com/',
      description: 'Paste into Gemini for research',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      name: 'NotebookLM',
      icon: '📚',
      url: 'https://notebooklm.google.com/',
      description: 'Create a new source in NotebookLM',
      color: 'from-purple-500 to-pink-600'
    }
  ]

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <span className="text-3xl">📋</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Content Copied!</h2>
              <p className="text-blue-100 text-sm mt-1">
                {linkCount} link{linkCount !== 1 ? 's' : ''} copied to clipboard
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6 text-center">
            Now paste your content into your favorite AI tool:
          </p>

          {/* Destination Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {destinations.map((dest) => (
              <a
                key={dest.name}
                href={dest.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group block p-5 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all hover:shadow-lg hover:scale-105 transform"
              >
                <div className="flex items-start gap-3">
                  <div className={`bg-gradient-to-br ${dest.color} p-3 rounded-lg text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                    {dest.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {dest.name}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {dest.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              💡 How to use
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Click on your preferred AI tool above</li>
              <li>Paste the content (Cmd+V or Ctrl+V)</li>
              <li>Ask the AI to analyze or summarize your research</li>
            </ol>
          </div>

          {/* Close Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

