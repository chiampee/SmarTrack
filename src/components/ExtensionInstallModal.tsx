import React, { useState } from 'react'
import { X, Chrome, Download, CheckCircle2, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ExtensionInstallModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
}

export const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({
  isOpen,
  onClose,
  onDownload
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const steps = [
    {
      number: 1,
      title: 'Download & Extract',
      description: 'Click below to download, then extract the ZIP file to any folder on your computer.',
      icon: Download,
      action: onDownload,
      combined: true
    },
    {
      number: 2,
      title: 'Install in Chrome',
      description: 'Click "Open Extensions Page" below, enable Developer Mode (top-right toggle), then click "Load unpacked" and select the extracted folder.',
      icon: Chrome,
      action: () => {
        window.open('chrome://extensions/', '_blank')
      },
      combined: true
    }
  ]

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('smartrack-extension-install-dismissed', 'true')
    }
    onClose()
  }

  const handleDownloadAndNext = () => {
    onDownload()
    setCurrentStep(1)
  }

  const handleOpenExtensionsAndNext = () => {
    // Open Chrome extensions page
    // chrome:// URLs can be opened from user interactions in Chrome
    try {
      // Primary method: window.open
      const newWindow = window.open('chrome://extensions/', '_blank')
      
      // If that doesn't work, try alternative method
      if (!newWindow) {
        const link = document.createElement('a')
        link.href = 'chrome://extensions/'
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Failed to open Chrome extensions page:', error)
      // Show user instructions if automatic opening fails
      alert('Please manually navigate to chrome://extensions/ in a new tab')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col m-2 sm:m-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Chrome className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Install SmarTrack Extension</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Get the full power of SmarTrack with our Chrome extension
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Why Install Section */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Why install the extension?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Save any webpage with one click while browsing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Automatic content extraction and AI-powered summaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Save highlighted text directly from any page</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Quick access to your saved links from any website</span>
                </li>
              </ul>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Installation</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">2 simple steps</span>
              </div>
              
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : isCompleted
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Number Circle */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          step.number
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon
                            className={`w-5 h-5 flex-shrink-0 ${
                              isActive
                                ? 'text-indigo-600'
                                : isCompleted
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <h4
                            className={`font-semibold ${
                              isActive
                                ? 'text-indigo-900'
                                : isCompleted
                                ? 'text-green-900'
                                : 'text-gray-600'
                            }`}
                          >
                            {step.title}
                          </h4>
                        </div>
                        <p
                          className={`text-sm ${
                            isActive
                              ? 'text-gray-700'
                              : isCompleted
                              ? 'text-gray-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {step.description}
                        </p>

                        {/* Action Button for Step 1 */}
                        {step.number === 1 && isActive && (
                          <button
                            onClick={handleDownloadAndNext}
                            className="mt-3 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-semibold shadow-md"
                          >
                            <Download className="w-5 h-5" />
                            Download Extension
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}

                        {/* Action Button for Step 2 */}
                        {step.number === 2 && isActive && (
                          <div className="mt-3 space-y-3">
                            <button
                              onClick={handleOpenExtensionsAndNext}
                              className="w-full px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold shadow-md"
                            >
                              <Chrome className="w-5 h-5" />
                              Open Extensions Page
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="font-semibold text-blue-900 mb-2">Then do these 3 quick actions:</p>
                              <ol className="list-decimal list-inside space-y-1.5 text-blue-800">
                                <li>Toggle <strong>"Developer mode"</strong> (top-right switch)</li>
                                <li>Click <strong>"Load unpacked"</strong> button</li>
                                <li>Select the folder you extracted</li>
                              </ol>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="dontShowAgain"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Don't show this again
                </label>
              </div>

              <div className="flex items-center gap-3">
                {currentStep === 0 && (
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Already downloaded? Skip to Step 2 →
                  </button>
                )}
                {currentStep === steps.length - 1 && (
                  <button
                    onClick={handleClose}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-semibold shadow-md"
                  >
                    All Set!
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
