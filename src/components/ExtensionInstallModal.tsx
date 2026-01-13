import React, { useState } from 'react'
import { X, Chrome, Download, CheckCircle2, ArrowRight, Sparkles, FileArchive, Settings, FolderOpen, Copy, Check } from 'lucide-react'
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
  const [downloaded, setDownloaded] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)

  const steps = [
    {
      number: 1,
      title: 'Download & Extract',
      description: 'Download the extension ZIP file and extract it to any folder on your computer.',
      icon: Download,
      action: onDownload,
      subSteps: [
        { icon: Download, text: 'Click "Download Extension" below' },
        { icon: FileArchive, text: 'Extract the ZIP file to a folder' }
      ]
    },
    {
      number: 2,
      title: 'Install in Chrome',
      description: 'Open Chrome extensions page and load the extension.',
      icon: Chrome,
      action: () => {
        window.open('chrome://extensions/', '_blank')
      },
      subSteps: [
        { icon: Chrome, text: 'Open Extensions Page (click button below)' },
        { icon: Settings, text: 'Enable "Developer mode" (top-right toggle)' },
        { icon: FolderOpen, text: 'Click "Load unpacked" and select the extracted folder' }
      ]
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
    setDownloaded(true)
    // Auto-advance after a short delay to let user see the download
    setTimeout(() => {
      setCurrentStep(1)
    }, 800)
  }

  const copyExtensionsUrl = async () => {
    try {
      await navigator.clipboard.writeText('chrome://extensions/')
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = 'chrome://extensions/'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    }
  }

  // Progress calculation
  const progress = ((currentStep + 1) / steps.length) * 100

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) {
            handleClose()
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col m-2 sm:m-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Progress */}
          <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex items-center justify-between p-5 sm:p-6">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-white/20 p-2.5 sm:p-3 rounded-xl flex-shrink-0">
                  <Chrome className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">Install Extension</h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            {/* Benefits - Collapsible or more compact */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1.5">Why install?</h3>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>One-click save from any webpage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>AI-powered summaries automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Save highlighted text instantly</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Current Step */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                if (!isActive && !isCompleted) return null

                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : isCompleted
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Number Circle */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-base transition-all shadow-sm ${
                          isActive
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-7 h-7" />
                        ) : (
                          step.number
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Icon
                            className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${
                              isActive
                                ? 'text-indigo-600'
                                : isCompleted
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <h4
                            className={`font-bold text-base sm:text-lg ${
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
                          className={`text-sm sm:text-base mb-4 ${
                            isActive
                              ? 'text-gray-700'
                              : isCompleted
                              ? 'text-gray-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {step.description}
                        </p>

                        {/* Sub-steps for better clarity */}
                        {isActive && step.subSteps && (
                          <div className="mb-4 space-y-2">
                            {step.subSteps.map((subStep, subIndex) => {
                              const SubIcon = subStep.icon
                              return (
                                <div
                                  key={subIndex}
                                  className="flex items-center gap-2.5 p-2.5 bg-white/60 rounded-lg border border-indigo-200/50"
                                >
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <SubIcon className="w-3.5 h-3.5 text-indigo-600" />
                                  </div>
                                  <span className="text-sm text-gray-700">{subStep.text}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Action Button for Step 1 */}
                        {step.number === 1 && isActive && (
                          <motion.button
                            onClick={handleDownloadAndNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2.5 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl"
                          >
                            {downloaded ? (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                Downloaded! Continue →
                              </>
                            ) : (
                              <>
                                <Download className="w-5 h-5" />
                                Download Extension
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </motion.button>
                        )}

                        {/* Action Button for Step 2 */}
                        {step.number === 2 && isActive && (
                          <div className="space-y-4">
                            <motion.button
                              onClick={copyExtensionsUrl}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`w-full px-6 py-4 rounded-lg transition-colors flex items-center justify-center gap-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl ${
                                urlCopied
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                              }`}
                            >
                              {urlCopied ? (
                                <>
                                  <Check className="w-6 h-6" />
                                  <span>URL Copied! Paste in address bar</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-6 h-6" />
                                  <span>Copy Extensions Page URL</span>
                                  <ArrowRight className="w-5 h-5" />
                                </>
                              )}
                            </motion.button>
                            
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Next steps:</p>
                              <ol className="space-y-2.5 text-sm text-blue-800">
                                <li className="flex items-start gap-2.5">
                                  <span className="font-bold text-blue-700">1.</span>
                                  <span>Paste <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">chrome://extensions/</code> into your address bar and press Enter</span>
                                </li>
                                {step.subSteps?.slice(1).map((subStep, subIndex) => {
                                  const SubIcon = subStep.icon
                                  return (
                                    <li key={subIndex} className="flex items-start gap-2.5">
                                      <span className="font-bold text-blue-700">{subIndex + 2}.</span>
                                      <div className="flex items-center gap-2 flex-1">
                                        <SubIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                        <span>{subStep.text}</span>
                                      </div>
                                    </li>
                                  )
                                })}
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
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 sm:px-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="dontShowAgain"
                className="text-xs sm:text-sm text-gray-600 cursor-pointer select-none"
              >
                Don't show this again
              </label>
            </div>

            <div className="flex items-center gap-2.5">
              {currentStep === 0 && (
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Skip to Step 2 →
                </button>
              )}
              {currentStep === steps.length - 1 && (
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors flex items-center gap-2 text-sm sm:text-base font-semibold shadow-md"
                >
                  All Set!
                  <CheckCircle2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
