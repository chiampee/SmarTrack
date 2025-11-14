import React, { useState, useEffect, useRef } from 'react'
import { Link2, ExternalLink, CheckCircle2, ArrowRight, Sparkles, Zap, Globe, Clock } from 'lucide-react'

export const ExtensionPreview: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false)
  const [showInDashboard, setShowInDashboard] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timers: NodeJS.Timeout[] = []
    const currentRef = containerRef.current
    
    // Intersection Observer for scroll-triggered animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setIsVisible(true)
            setHasStarted(true)
            
            // Start animation sequence when component is visible
            const timer1 = setTimeout(() => {
              setIsSaving(true)
            }, 1000)
            const timer2 = setTimeout(() => {
              setIsSaving(false)
              setShowSuccess(true)
            }, 2500)
            const timer3 = setTimeout(() => setShowInDashboard(true), 4000)
            
            timers = [timer1, timer2, timer3]
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer))
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasStarted])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Step Indicator - Mobile Responsive */}
      <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 border border-blue-400/30 rounded-full">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
          <span className="text-xs sm:text-sm text-blue-200 font-medium whitespace-nowrap">Click Extension</span>
        </div>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/20 border border-purple-400/30 rounded-full">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
          <span className="text-xs sm:text-sm text-purple-200 font-medium whitespace-nowrap">Save Link</span>
        </div>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
        <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-500 ${
          showInDashboard 
            ? 'bg-emerald-500/20 border border-emerald-400/30' 
            : 'bg-slate-700/50 border border-slate-600/50'
        }`}>
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
            showInDashboard 
              ? 'bg-emerald-500 text-white' 
              : 'bg-slate-600 text-slate-400'
          }`}>3</div>
          <span className={`text-xs sm:text-sm font-medium transition-colors duration-500 whitespace-nowrap ${
            showInDashboard ? 'text-emerald-200' : 'text-slate-400'
          }`}>View in Dashboard</span>
        </div>
      </div>

      {/* Mobile Device Frame with Dashboard Background */}
      <div className={`relative mx-auto mb-8 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`} style={{ maxWidth: '400px', width: '100%' }}>
        {/* Mobile Frame */}
        <div className="relative bg-slate-900 rounded-3xl shadow-2xl border-4 border-slate-800" style={{ minHeight: '700px', paddingBottom: '1rem' }}>
          {/* Status Bar */}
          <div className="bg-slate-900 px-4 py-1 flex justify-between items-center text-white text-xs">
            <span>15:01</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-white rounded-sm"></div>
              <div className="w-3 h-3 border border-white rounded-full"></div>
              <span>100</span>
            </div>
          </div>

          {/* URL Bar */}
          <div className="bg-slate-800 px-3 py-2 text-xs text-slate-300 text-center">
            smar-track.vercel.app
          </div>

          {/* Dashboard Background (Blurred) */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden" style={{ filter: 'blur(2px)' }}>
            <div className="p-4 space-y-4">
              <div className="h-8 bg-slate-700/50 rounded w-3/4"></div>
              <div className="h-24 bg-slate-700/30 rounded"></div>
              <div className="h-32 bg-slate-700/30 rounded"></div>
            </div>
          </div>

          {/* Extension Popup Overlay */}
          <div 
            className={`absolute top-16 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-all duration-500 pb-6 ${
              isVisible ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            {/* Extension Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-5 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-xl">
                  <span className="text-blue-600 font-bold text-xl tracking-tight">ST</span>
                </div>
                <h3 className="text-xl font-bold mb-1 tracking-tight">Save to SmarTrack</h3>
                <p className="text-xs opacity-95 font-medium mb-3">Smart Research Tracking</p>
              </div>
            </div>

            {/* Extension Content */}
            <div className="p-4 pb-6 bg-white">
              {/* Page Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm mb-1 truncate">
                    Modern Web Development Guide
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono">
                    example.com/web-dev-guide
                  </div>
                </div>
              </div>

              {/* Form */}
              <form className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Title <span className="text-slate-400 font-normal">(auto-filled)</span>
                  </label>
                  <input
                    type="text"
                    value="Modern Web Development Guide"
                    readOnly
                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-slate-900 text-sm font-medium bg-blue-50/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Description <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value="A comprehensive guide to modern web development practices and frameworks."
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <div className="relative">
                    <select
                      value="Technology"
                      disabled
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm font-medium bg-white cursor-not-allowed appearance-none"
                    >
                      <option>Technology</option>
                      <option>Business</option>
                      <option>Research</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-500 shadow-lg relative overflow-hidden group ${
                      showSuccess 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                        : isSaving
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : showSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 animate-bounce" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <span>Save Link</span>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Flow Animation: Extension → Dashboard */}
      {showSuccess && (
        <div className={`mb-6 sm:mb-8 transition-all duration-1000 ${
          showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full mb-2 sm:mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm text-emerald-300 font-semibold">Link Successfully Saved!</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">Your link is now being synced to your dashboard...</p>
          </div>
          
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="text-center flex-1 max-w-[150px] sm:max-w-[200px]">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-2xl shadow-emerald-500/40 transform transition-all duration-500 hover:scale-110">
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="text-xs sm:text-sm text-emerald-400 font-bold mb-1">Saved</p>
              <p className="text-xs text-slate-400">Link stored securely</p>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 animate-pulse" />
              <div className="w-1 h-8 sm:h-12 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
            </div>
            
            <div className="text-center flex-1 max-w-[150px] sm:max-w-[200px]">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-2xl shadow-purple-500/40 transform transition-all duration-500 hover:scale-110">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="text-xs sm:text-sm text-purple-300 font-bold mb-1">Syncing</p>
              <p className="text-xs text-slate-400">To dashboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Dashboard Preview with New Link */}
      {showInDashboard && (
        <div className={`transition-all duration-1000 ${
          showInDashboard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Step 3 Label */}
          <div className="text-center mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Step 3: View in Dashboard</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/20 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-pulse pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                <div className="relative">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-xs sm:text-sm text-emerald-300 font-bold tracking-wide flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="hidden sm:inline">New link appears in your dashboard</span>
                  <span className="sm:hidden">New link added</span>
                </span>
              </div>
              
              <div className="bg-gradient-to-br from-slate-700/95 via-slate-800/95 to-slate-700/95 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-slate-600/50 hover:border-emerald-500/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/10 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Link2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-base sm:text-lg mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 group-hover:text-emerald-300 transition-colors duration-300">
                      <span className="truncate">Modern Web Development Guide</span>
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                    </h4>
                    <p className="text-xs text-slate-400 mb-1.5 sm:mb-2 font-mono truncate">https://example.com/web-dev-guide</p>
                    <p className="text-xs sm:text-sm text-slate-300 mb-3 sm:mb-4 leading-relaxed line-clamp-2">A comprehensive guide to modern web development practices and frameworks.</p>
                    
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-300 rounded-md sm:rounded-lg text-xs border border-indigo-500/30 font-semibold shadow-sm">
                        Technology
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 sm:gap-1.5 font-medium">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                        Just now
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
