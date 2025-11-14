import React, { useState, useEffect, useRef } from 'react'
import { Link2, ExternalLink, CheckCircle2, ArrowRight, Sparkles, Zap, Globe, Clock, MousePointerClick } from 'lucide-react'

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
        threshold: 0.2, // Trigger when 20% of component is visible
        rootMargin: '0px 0px -50px 0px' // Start slightly before fully in view
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
    <div ref={containerRef} className="relative">
      {/* Step Indicator */}
      <div className={`flex items-center justify-center gap-2 mb-6 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
          <span className="text-sm text-blue-200 font-medium">Click Extension</span>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400" />
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
          <span className="text-sm text-purple-200 font-medium">Save Link</span>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 ${
          showInDashboard 
            ? 'bg-emerald-500/20 border border-emerald-400/30' 
            : 'bg-slate-700/50 border border-slate-600/50'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
            showInDashboard 
              ? 'bg-emerald-500 text-white' 
              : 'bg-slate-600 text-slate-400'
          }`}>3</div>
          <span className={`text-sm font-medium transition-colors duration-500 ${
            showInDashboard ? 'text-emerald-200' : 'text-slate-400'
          }`}>View in Dashboard</span>
        </div>
      </div>

      {/* Extension Popup Preview */}
      <div 
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50 w-full max-w-md mx-auto mb-8 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Step 1 Label */}
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2">
          <div className="flex items-center gap-2 text-blue-600">
            <MousePointerClick className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Step 1: Browser Extension Popup</span>
          </div>
        </div>

        {/* Header with enhanced gradient */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-7 text-white text-center relative overflow-hidden">
          {/* Animated background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}></div>
          
          <div className="relative z-10">
            {/* Logo with enhanced styling */}
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl transform transition-transform duration-300 hover:scale-110 hover:rotate-3">
              <span className="text-blue-600 font-bold text-2xl tracking-tight">ST</span>
            </div>
            
            <h3 className="text-2xl font-bold mb-2 tracking-tight">Save to SmarTrack</h3>
            <p className="text-sm opacity-95 font-medium mb-4">Smart Research Tracking</p>
            
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg group">
              <span>Open Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Content with better spacing */}
        <div className="p-6 bg-gradient-to-b from-white to-slate-50/50">
          {/* Page Preview Card with label */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Page detected automatically
            </p>
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm mb-1.5 truncate group-hover:text-blue-600 transition-colors">
                  Modern Web Development Guide
                </div>
                <div className="text-xs text-slate-500 truncate font-mono">
                  example.com/web-dev-guide
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Form */}
          <form className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 tracking-wide">
                Title <span className="text-slate-400 font-normal text-xs">(auto-filled)</span>
              </label>
              <input
                type="text"
                value="Modern Web Development Guide"
                readOnly
                className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-blue-50/30 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 tracking-wide">
                Description <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <textarea
                value="A comprehensive guide to modern web development practices and frameworks."
                readOnly
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none leading-relaxed transition-all duration-200"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 tracking-wide">
                Category
              </label>
              <div className="relative">
                <select
                  value="Technology"
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white cursor-not-allowed appearance-none"
                >
                  <option>Technology</option>
                  <option>Business</option>
                  <option>Research</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Step 2 Label */}
            <div className="pt-2 pb-1">
              <div className="flex items-center gap-2 text-purple-600 mb-3">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Step 2: Click Save</span>
              </div>
            </div>

            {/* Enhanced Save Button with Animation */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                className={`flex-1 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg relative overflow-hidden group ${
                  showSuccess 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                    : isSaving
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:shadow-xl'
                }`}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : showSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 animate-bounce" />
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

      {/* Enhanced Flow Animation: Extension → Dashboard */}
      {showSuccess && (
        <div className={`mb-8 transition-all duration-1000 ${
          showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-semibold">Link Successfully Saved!</span>
            </div>
            <p className="text-sm text-slate-400">Your link is now being synced to your dashboard...</p>
          </div>
          
          <div className="flex items-center justify-center gap-6">
            <div className="text-center flex-1 max-w-[200px]">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-emerald-500/40 transform transition-all duration-500 hover:scale-110">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-emerald-400 font-bold mb-1">Saved</p>
              <p className="text-xs text-slate-400">Link stored securely</p>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="w-8 h-8 text-blue-400 animate-pulse" />
              <div className="w-1 h-12 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
              <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            
            <div className="text-center flex-1 max-w-[200px]">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-purple-500/40 transform transition-all duration-500 hover:scale-110">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-purple-300 font-bold mb-1">Syncing</p>
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
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Step 3: View in Dashboard</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/20 relative overflow-hidden backdrop-blur-sm">
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-pulse pointer-events-none"></div>
            
            {/* Success indicator */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm text-emerald-300 font-bold tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                  New link appears in your dashboard
                </span>
              </div>
              
              {/* Enhanced Link Card */}
              <div className="bg-gradient-to-br from-slate-700/95 via-slate-800/95 to-slate-700/95 rounded-xl p-5 border border-slate-600/50 hover:border-emerald-500/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/10 group relative overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex items-start gap-4">
                  {/* Enhanced favicon */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex-shrink-0 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Link2 className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-lg mb-2 flex items-center gap-2 group-hover:text-emerald-300 transition-colors duration-300">
                      Modern Web Development Guide
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </h4>
                    <p className="text-xs text-slate-400 mb-2 font-mono">https://example.com/web-dev-guide</p>
                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">A comprehensive guide to modern web development practices and frameworks.</p>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-300 rounded-lg text-xs border border-indigo-500/30 font-semibold shadow-sm">
                        Technology
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Just now
                      </span>
                    </div>
                  </div>
                  
                  {/* Success checkmark */}
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
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
