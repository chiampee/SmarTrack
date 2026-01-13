import React, { useState } from 'react'
import { X, Chrome, Download, FileArchive, Settings, CheckCircle2, ArrowRight } from 'lucide-react'
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
      title: 'Download the Extension',
      description: 'Click the download button below to get the SmarTrack extension file.',
      icon: Download,
      action: onDownload
    },
    {
      number: 2,
      title: 'Extract the ZIP File',
      description: 'Locate the downloaded file and extract it to a folder on your computer.',
      icon: FileArchive
    },
    {
      number: 3,
      title: 'Open Chrome Extensions Page',
      description: 'Open a new tab and navigate to chrome://extensions/ or click the button below.',
      icon: Chrome,
      action: () => {
        window.open('chrome://extensions/', '_blank')
      }
    },
    {
      number: 4,
      title: 'Enable Developer Mode',
      description: 'Toggle the "Developer mode" switch in the top-right corner of the extensions page.',
      icon: Settings
    },
    {
      number: 5,
      title: 'Load the Extension',
      description: 'Click "Load unpacked" and select the folder where you extracted the extension.',
      icon: CheckCircle2
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Installation Steps</h3>
              
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
                            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            Download Extension
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}

                        {/* Action Button for Step 3 */}
                        {step.number === 3 && isActive && (
                          <button
                            onClick={() => {
                              step.action?.()
                              setCurrentStep(4)
                            }}
                            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <Chrome className="w-4 h-4" />
                            Open Extensions Page
                            <ArrowRight className="w-4 h-4" />
                          </button>
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
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Previous
                  </button>
                )}
                {currentStep < steps.length - 1 && currentStep !== 0 && (
                  <button
                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {currentStep === steps.length - 1 && (
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    Got it!
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
