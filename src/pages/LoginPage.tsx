import React, { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import { Shield, Cloud, Zap, BookOpen, Search, Tag, Link2, Brain, BarChart3, Clock, Lock, CheckCircle2, ArrowRight, Star, LogIn } from 'lucide-react'
import { DashboardPreview } from '../components/DashboardPreview'
import { ExtensionPreview } from '../components/ExtensionPreview'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string; benefit?: string }> = ({
  icon,
  title,
  description,
  benefit,
}) => (
  <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 ease-out hover:scale-[1.02] will-change-transform">
    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white w-fit mb-4 group-hover:scale-110 transition-transform duration-500 ease-out will-change-transform">{icon}</div>
    <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
    <p className="text-sm text-purple-200 mb-2 leading-relaxed">{description}</p>
    {benefit && (
      <p className="text-xs text-blue-300 font-medium flex items-center gap-1 mt-3">
        <CheckCircle2 className="w-3 h-3" />
        {benefit}
      </p>
    )}
  </div>
)


export const LoginPage: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  
  // Scroll animations for sections
  const heroAnimation = useScrollAnimation({ threshold: 0.2 })
  const extensionAnimation = useScrollAnimation({ threshold: 0.1 })
  const dashboardAnimation = useScrollAnimation({ threshold: 0.1 })
  const featuresAnimation = useScrollAnimation({ threshold: 0.1 })
  const statsAnimation = useScrollAnimation({ threshold: 0.1 })
  const useCasesAnimation = useScrollAnimation({ threshold: 0.1 })
  const howItWorksAnimation = useScrollAnimation({ threshold: 0.1 })
  const finalCTAAnimation = useScrollAnimation({ threshold: 0.1 })

  // Validate authentication state - redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // User is already signed in, redirect to dashboard
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-purple-200">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Top Navigation Header */}
      <div className="relative z-20">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/logo.svg" 
                alt="SmarTrack" 
                className="h-10 sm:h-12 w-auto"
              />
            </div>
            
            {/* Sign In Button */}
            <button
              onClick={() => loginWithRedirect()}
              className="group inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 text-white font-semibold rounded-xl transition-all duration-500 ease-out transform hover:scale-105 active:scale-95 will-change-transform"
            >
              <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Sign In</span>
            </button>
          </div>
        </nav>
      </div>

      <div className="relative z-10">
        {/* Hero Section with Primary CTA */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
          <div ref={heroAnimation.elementRef} className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 transition-all duration-1000 ${
            heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="text-center">
              {/* Headline - Clear & Compelling */}
              <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 max-w-5xl mx-auto leading-tight transition-all duration-1000 delay-100 ${
                heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                Never Lose Research Again.
                <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Find Everything Instantly.
                </span>
              </h1>
              
              {/* Value Proposition - Authentic & Clear */}
              <p className="text-lg sm:text-xl md:text-2xl text-purple-200 mb-4 max-w-3xl mx-auto font-medium">
                The research tool that helps you <span className="text-white font-bold">organize, analyze, and find</span> everything you save
              </p>
              <p className="text-base sm:text-lg text-purple-300 mb-10 max-w-2xl mx-auto">
                Save any webpage instantly. Get AI-powered summaries. Search your entire research library in seconds.
              </p>
          
              {/* Primary CTA - More Prominent */}
              <div className="mb-10">
                <button
                  onClick={() => loginWithRedirect()}
                  className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 ease-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl mb-4 relative overflow-hidden will-change-transform gpu-accelerated"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                  <Zap className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Get Started Free — No Credit Card</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-purple-300">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Free forever
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Setup in 30 seconds
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    No credit card required
                  </span>
                </div>
              </div>

              {/* Value Badge - Authentic */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-purple-200 mb-12">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Start organizing your research <span className="text-white font-semibold">today</span></span>
              </div>
            </div>

            {/* Extension Preview - Save Flow */}
            <div ref={extensionAnimation.elementRef} className={`mt-16 mb-12 max-w-5xl mx-auto transition-all duration-1000 ${
              extensionAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className={`text-center mb-10 transition-all duration-1000 delay-200 ${
                extensionAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <h3 className="text-3xl font-bold text-white mb-3">How It Works: Save Links in 3 Simple Steps</h3>
                <p className="text-lg text-purple-200 max-w-2xl mx-auto">
                  Our browser extension makes saving research links effortless. Watch how easy it is to capture and organize any webpage.
                </p>
              </div>
              <div className={`relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 transition-all duration-1000 delay-300 ${
                extensionAnimation.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                <ExtensionPreview />
              </div>
            </div>

            {/* Product Preview - Dashboard Preview */}
            <div ref={dashboardAnimation.elementRef} className={`mt-16 mb-8 max-w-6xl mx-auto transition-all duration-1000 ${
              dashboardAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
                <div className="relative bg-slate-900">
                  {/* Try to load image first, fallback to component */}
                  <img 
                    src="/dashboard-screenshot.png" 
                    alt="SmarTrack Research Dashboard - Organize your research with AI-powered tools"
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      // Hide image and show component preview
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const fallback = document.getElementById('dashboard-preview-fallback')
                      if (fallback) fallback.style.display = 'block'
                    }}
                  />
                  {/* Interactive Dashboard Preview Component */}
                  <div id="dashboard-preview-fallback" style={{ display: 'none' }}>
                    <DashboardPreview />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Key Features - Shorter, Benefit-Focused */}
        <div ref={featuresAnimation.elementRef} className={`mb-20 py-12 transition-all duration-1000 ${
          featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className={`text-center mb-12 transition-all duration-1000 delay-100 ${
            featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Master Research
            </h2>
            <p className="text-lg text-purple-300 max-w-2xl mx-auto">
              Powerful features designed to make research effortless
            </p>
          </div>
          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-1000 delay-200 ${
            featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <Feature
              icon={<BookOpen className="w-6 h-6" />}
              title="One-Click Save"
              description="Save any webpage instantly with our browser extension. Automatically extracts content, title, and metadata."
              benefit="Never lose important research again"
            />
            <Feature
              icon={<Brain className="w-6 h-6" />}
              title="AI-Powered Summaries"
              description="Get instant summaries and key insights. Understand documents at a glance without reading everything."
              benefit="Understand content faster"
            />
            <Feature
              icon={<Tag className="w-6 h-6" />}
              title="Smart Organization"
              description="AI automatically categorizes and tags your research. Create collections and stay organized effortlessly."
              benefit="Organize without the manual work"
            />
            <Feature
              icon={<Search className="w-6 h-6" />}
              title="Lightning-Fast Search"
              description="Search across titles, content, tags, and summaries. Find exactly what you need instantly."
              benefit="Find anything in seconds"
            />
            <Feature
              icon={<Cloud className="w-6 h-6" />}
              title="Cloud Sync"
              description="Access your research library from any device. All your data syncs automatically and securely."
              benefit="Access from anywhere"
            />
            <Feature
              icon={<Shield className="w-6 h-6" />}
              title="Privacy First"
              description="Your data is encrypted and secure. GDPR compliant. Your research stays private and yours."
              benefit="Your data, your control"
            />
          </div>
        </div>

        {/* Stats - Enhanced Visual Design */}
        <div ref={statsAnimation.elementRef} className={`mb-20 py-12 border-t border-white/10 transition-all duration-1000 ${
          statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className={`text-center mb-10 transition-all duration-1000 delay-100 ${
            statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Built for Speed & Scale
            </h2>
            <p className="text-purple-300">Fast, powerful, and unlimited</p>
          </div>
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto transition-all duration-1000 delay-200 ${
            statsAnimation.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <div className="flex justify-center mb-3 text-blue-400"><Link2 className="w-8 h-8" /></div>
              <div className="text-4xl font-extrabold text-white mb-2">∞</div>
              <div className="text-sm text-purple-200 font-medium">Unlimited Saves</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex justify-center mb-3 text-purple-400"><BarChart3 className="w-8 h-8" /></div>
              <div className="text-4xl font-extrabold text-white mb-2">&lt;2s</div>
              <div className="text-sm text-purple-200 font-medium">AI Analysis</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20">
              <div className="flex justify-center mb-3 text-green-400"><Clock className="w-8 h-8" /></div>
              <div className="text-4xl font-extrabold text-white mb-2">&lt;1s</div>
              <div className="text-sm text-purple-200 font-medium">Search Speed</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
              <div className="flex justify-center mb-3 text-orange-400"><Shield className="w-8 h-8" /></div>
              <div className="text-4xl font-extrabold text-white mb-2">100%</div>
              <div className="text-sm text-purple-200 font-medium">Your Data</div>
            </div>
          </div>
        </div>

        {/* Use Cases - More Scannable */}
        <div ref={useCasesAnimation.elementRef} className={`mb-20 py-12 border-t border-white/10 transition-all duration-1000 ${
          useCasesAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className={`text-center mb-10 transition-all duration-1000 delay-100 ${
            useCasesAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Built for Knowledge Workers
            </h2>
            <p className="text-purple-300">Perfect for anyone who needs to organize and find research quickly</p>
          </div>
          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto transition-all duration-1000 delay-200 ${
            useCasesAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {[
              { role: 'Academic Researchers', task: 'Papers, findings, bibliographies', icon: '🎓' },
              { role: 'PhD Students', task: 'Literature reviews, citations', icon: '📚' },
              { role: 'Journalists', task: 'Research, fact-checking, archives', icon: '📰' },
              { role: 'Content Creators', task: 'Inspiration, competitors, ideas', icon: '✍️' },
              { role: 'Product Managers', task: 'Features, competitors, trends', icon: '🚀' },
              { role: 'Lawyers', task: 'Case law, precedents, key points', icon: '⚖️' },
            ].map((item) => (
              <div
                key={item.role}
                className="p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h4 className="font-bold text-white mb-1.5 text-lg">{item.role}</h4>
                <p className="text-sm text-purple-300">{item.task}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works - Visual Flow */}
        <div ref={howItWorksAnimation.elementRef} className={`mb-20 py-12 border-t border-white/10 transition-all duration-1000 ${
          howItWorksAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className={`text-center mb-10 transition-all duration-1000 delay-100 ${
            howItWorksAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-purple-300">From signup to saving your first link in under 2 minutes</p>
          </div>
          <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto transition-all duration-1000 delay-200 ${
            howItWorksAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {[
              { step: '1', title: 'Sign Up Free', desc: 'Create account in 30 seconds. No credit card needed.', icon: <Lock className="w-5 h-5" /> },
              { step: '2', title: 'Save Links', desc: 'Install extension and save any webpage with one click.', icon: <Link2 className="w-5 h-5" /> },
              { step: '3', title: 'AI Analyzes', desc: 'Get instant summaries and auto-categorization.', icon: <Brain className="w-5 h-5" /> },
              { step: '4', title: 'Find Instantly', desc: 'Search and discover your research in seconds.', icon: <Search className="w-5 h-5" /> },
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -z-10" style={{ width: 'calc(100% - 4rem)', left: 'calc(50% + 2rem)' }}></div>
                )}
                <div className="text-center p-6 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all h-full">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-white mb-2 text-lg">{item.title}</h4>
                  <p className="text-sm text-purple-300 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA - Authentic & Compelling */}
        <div ref={finalCTAAnimation.elementRef} className={`mb-12 py-16 transition-all duration-1000 ${
          finalCTAAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="relative text-center bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-3xl p-12 sm:p-16 border-2 border-white/20 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 animate-pulse"></div>
            <div className={`relative z-10 transition-all duration-1000 delay-200 ${
              finalCTAAnimation.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 text-sm text-purple-200">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>Start organizing your research today</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 max-w-3xl mx-auto leading-tight">
                Ready to Transform Your Research Workflow?
              </h2>
              <p className="text-lg sm:text-xl text-purple-200 mb-8 max-w-2xl mx-auto font-medium">
                Join SmarTrack and start organizing your research with AI. Free forever, no credit card required.
              </p>
              <button
                onClick={() => loginWithRedirect()}
                className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 text-lg sm:text-xl mb-6 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                <Zap className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Get Started Free Now</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-purple-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Free forever
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
