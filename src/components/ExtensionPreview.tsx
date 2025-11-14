import React, { useState, useEffect } from 'react'
import { Link2, ExternalLink, CheckCircle2, ArrowRight, Sparkles, Zap } from 'lucide-react'

export const ExtensionPreview: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false)
  const [showInDashboard, setShowInDashboard] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Animate the save process
    const timer1 = setTimeout(() => {
      setIsSaving(true)
    }, 1500)
    const timer2 = setTimeout(() => {
      setIsSaving(false)
      setShowSuccess(true)
    }, 2500)
    const timer3 = setTimeout(() => setShowInDashboard(true), 4000)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  return (
    <div className="relative">
      {/* Extension Popup Preview */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-white/20 w-full max-w-md mx-auto mb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-blue-600 font-bold text-xl">ST</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Save to SmarTrack</h3>
            <p className="text-sm opacity-90">Smart Research Tracking</p>
            <button className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-sm transition-all duration-300 transform hover:scale-105">
              Open Dashboard <ExternalLink className="w-3 h-3 inline ml-1" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 bg-white">
          {/* Page Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex-shrink-0 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 text-sm mb-1 truncate">
                Modern Web Development Guide
              </div>
              <div className="text-xs text-slate-500 truncate">
                https://example.com/web-dev-guide
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
              <input
                type="text"
                value="Modern Web Development Guide"
                readOnly
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-blue-50/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                value="A comprehensive guide to modern web development practices"
                readOnly
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select
                value="Technology"
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white cursor-not-allowed opacity-100"
              >
                <option>Technology</option>
                <option>Business</option>
                <option>Research</option>
              </select>
            </div>

            {/* Save Button with Animation */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden ${
                  showSuccess ? 'bg-gradient-to-r from-green-500 to-green-600' : ''
                } ${isSaving ? 'animate-pulse' : ''}`}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : showSuccess ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 animate-bounce" />
                    Saved!
                  </span>
                ) : (
                  <span>Save Link</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Flow Animation: Extension → Dashboard */}
      {showSuccess && (
        <div className="flex items-center justify-center gap-6 mb-8 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-green-500/50 animate-pulse">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-green-300 font-semibold">Link Saved!</p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <ArrowRight className="w-8 h-8 text-blue-400 animate-pulse" />
            <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-purple-500/50 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-purple-200 font-semibold">Appears in Dashboard</p>
          </div>
        </div>
      )}

      {/* Dashboard Preview with New Link */}
      {showInDashboard && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border-2 border-green-500/30 shadow-2xl shadow-green-500/20 animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-sm text-green-300 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                New link added to dashboard
              </span>
            </div>
            <div className="bg-gradient-to-br from-slate-700/90 to-slate-800/90 rounded-lg p-4 border border-slate-600/50 hover:border-green-500/50 transition-all duration-300 transform hover:scale-[1.02] group">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-base mb-1 flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                    Modern Web Development Guide
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </h4>
                  <p className="text-xs text-slate-400 mb-2">https://example.com/web-dev-guide</p>
                  <p className="text-sm text-slate-300 mb-3">A comprehensive guide to modern web development practices</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded-md text-xs border border-purple-500/30 font-medium">
                      Technology
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      Just now
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

