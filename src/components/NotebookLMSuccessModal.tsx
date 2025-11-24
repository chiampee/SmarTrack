import React from 'react'
import { X, ExternalLink, FileText, CheckCircle2, ArrowRight } from 'lucide-react'

interface NotebookLMSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  driveLink: string
  docId: string
}

export const NotebookLMSuccessModal: React.FC<NotebookLMSuccessModalProps> = ({
  isOpen,
  onClose,
  driveLink,
  docId
}) => {
  if (!isOpen) return null

  const notebookLMLink = `https://notebooklm.google.com`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
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
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Export Successful!</h2>
              <p className="text-blue-100 text-sm mt-1">Your links have been exported to Google Drive</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <FileText className="w-5 h-5" />
              Open in Google Drive
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={notebookLMLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Open NotebookLM
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Document Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Your Document
            </h3>
            <p className="text-sm text-blue-800 break-all">
              <span className="font-medium">Document ID:</span> {docId}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              This document is saved in your Google Drive and ready to import into NotebookLM
            </p>
          </div>

          {/* Step-by-step Guide */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                📚
              </span>
              How to Import into NotebookLM
            </h3>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Open NotebookLM</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Go to{' '}
                    <a 
                      href={notebookLMLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      notebooklm.google.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Create or Open a Notebook</h4>
                  <p className="text-sm text-gray-600">
                    Click <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">+ New Notebook</span> or open an existing one
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Add Source from Google Drive</h4>
                  <p className="text-sm text-gray-600">
                    Click <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">Sources</span> → 
                    <span className="font-medium bg-gray-100 px-2 py-0.5 rounded ml-1">+ Add Source</span> → 
                    <span className="font-medium bg-gray-100 px-2 py-0.5 rounded ml-1">Google Drive</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Select Your SmarTrack Export</h4>
                  <p className="text-sm text-gray-600">
                    Find and select your <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">SmarTrack Export</span> document
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              💡 Pro Tips
            </h4>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>NotebookLM will analyze all your links and create AI-powered insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>You can ask questions about your research and get instant answers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>Export multiple sets of links to organize different research topics</span>
              </li>
            </ul>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

