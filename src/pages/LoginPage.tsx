import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Chrome, 
  ScanEye, 
  ShieldCheck, 
  LayoutGrid, 
  Sparkles,
  Menu,
  X
} from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { Logo } from '../components/Logo'
import { SiloVsHubVisualization } from '../components/SiloVsHubVisualization'
import { DashboardListView } from '../components/DashboardListView'
import { ExtensionPopupPreview } from '../components/ExtensionPopupPreview'
import { CategorySelectionPreview } from '../components/CategorySelectionPreview'

export const LoginPage = () => {
  const { loginWithRedirect } = useAuth0()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Logo showText={true} iconSize="md" linkToHome={true} />

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                to="/docs"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Documentation
              </Link>
              <Link 
                to="/faq"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                FAQ
              </Link>
              <button 
                onClick={() => loginWithRedirect()}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => loginWithRedirect()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-sm hover:shadow-md active:transform active:scale-95"
              >
                <Chrome className="w-4 h-4" />
                Install Extension
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2.5 text-slate-600 touch-manipulation active:bg-slate-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2">
            <Link 
              to="/docs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left px-4 py-3 text-slate-600 font-medium rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
            >
              Documentation
            </Link>
            <Link 
              to="/faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left px-4 py-3 text-slate-600 font-medium rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
            >
              FAQ
            </Link>
             <button 
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  loginWithRedirect()
                }}
                className="block w-full text-left px-4 py-3 text-slate-600 font-medium rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
              >
                Sign In
              </button>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  loginWithRedirect()
                }}
                className="block w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg text-center hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
              >
                Install Extension
              </button>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-20 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-6 sm:mb-8">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              New: LinkedIn & YouTube Parsers
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-4 sm:mb-6 px-2">
              Stop Losing Insights <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">to the Feed.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">
              Centralize your research from LinkedIn, X, and the Open Web into one searchable intelligence hub. Capture the context instead of just the link.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 md:mb-16 px-4">
              <button 
                onClick={() => loginWithRedirect()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-full text-base sm:text-lg shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 active:translate-y-0 touch-manipulation"
              >
                Sign In
              </button>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Free forever for personal use</p>
            </motion.div>

            {/* Dashboard Visual */}
            <motion.div 
              variants={fadeIn}
              className="relative rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl shadow-blue-900/10 ring-1 ring-slate-200/60 border border-slate-200 mx-2 sm:mx-0"
            >
              <DashboardListView />
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />
      </section>

      {/* 3. The Problem Section (Silo vs Hub) */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 px-2">Your Knowledge is Fragmented.</h2>
            <p className="text-base sm:text-lg text-slate-600 px-2">
              You save a chart on LinkedIn. You bookmark a report on Chrome. But when you need them, they are buried by algorithms. 
              <span className="font-semibold text-slate-900"> If you can't find it, you didn't save it.</span>
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto px-2 sm:px-0">
            <SiloVsHubVisualization />
          </div>
        </div>
      </section>

      {/* 4. The Solution Section (The Bridge) */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 px-2">Escape the Walled Gardens.</h2>
            <p className="text-base sm:text-lg text-slate-600 px-2">SmarTrack works as the bridge between your social feeds and your personal library.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -z-10" />

            {[
              {
                icon: ScanEye,
                title: "1. Capture",
                desc: "Auto-extract the author, image, and full context. No screenshots required."
              },
              {
                icon: ShieldCheck,
                title: "2. Sanitize",
                desc: "We strip tracking pixels and clean URLs locally on your device."
              },
              {
                icon: LayoutGrid,
                title: "3. Centralize",
                desc: "Your research lands in one searchable library where it is tagged and ready."
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center bg-white p-4 sm:p-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-blue-100">
                  <step.icon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{step.title}</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Key Features Grid - Bento Layout */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
          >
            
            {/* Card 1: Visual Recall */}
            <motion.div 
              variants={fadeIn}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-56 sm:h-64 md:h-72 bg-white relative overflow-hidden pt-4 sm:pt-6 px-3 sm:px-4 pb-3 sm:pb-4 flex items-center justify-center">
                <ExtensionPopupPreview />
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Visual Recall</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Don't just save the URL. Capture the thumbnail, author, and summary, so you recognize your research instantly.</p>
              </div>
            </motion.div>

            {/* Card 2: Platform Agnostic */}
            <motion.div 
              variants={fadeIn}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-56 sm:h-64 md:h-72 bg-white relative overflow-hidden pt-4 sm:pt-6 px-3 sm:px-4 pb-3 sm:pb-4 flex items-center justify-center">
                <CategorySelectionPreview />
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Platform Agnostic</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Capture LinkedIn posts, PDFs, and Tweets as standard articles. No more screenshots.</p>
              </div>
            </motion.div>

            {/* Card 3: Built for Workflow - Full Width Horizontal Layout */}
            <motion.div 
              variants={fadeIn}
              className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Dashboard on Left (Desktop) / Top (Mobile) */}
                <div className="lg:w-2/3 bg-white relative overflow-hidden">
                  <DashboardListView />
                </div>
                {/* Text on Right (Desktop) / Bottom (Mobile) */}
                <div className="lg:w-1/3 p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col justify-center bg-gradient-to-br from-slate-50 to-white">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">Built for Workflow</h3>
                  <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed">Track competitors, build swipe files, and recall prospect details. Your research lands in a single searchable library, tagged and ready.</p>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* 6. Trust & Privacy */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20 pattern-grid-lg opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Privacy First Architecture
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">Intelligence Without Intrusion.</h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto px-2 leading-relaxed">
            Most tools demand passwords. SmarTrack is different. We use a <strong>Client-First Architecture</strong> in which capture occurs locally on your device. We never see your session data or passwords.
          </p>
        </div>
      </section>

      {/* 7. Footer CTA */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight px-2">Reclaim Your Digital Memory.</h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-6 sm:mb-8 md:mb-10 px-2">Join the researchers who have stopped bookmarking and started capturing.</p>
          <button 
            onClick={() => loginWithRedirect()}
            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-full text-base sm:text-lg shadow-xl shadow-blue-600/30 transition-transform hover:-translate-y-1 active:translate-y-0 touch-manipulation"
          >
            <Chrome className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="whitespace-nowrap">Add to Chrome - It's Free</span>
          </button>
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-slate-500">
            <a href="/privacy" className="hover:text-slate-900 transition-colors touch-manipulation">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-900 transition-colors touch-manipulation">Terms of Service</a>
            <a href="/faq" className="hover:text-slate-900 transition-colors touch-manipulation">FAQ</a>
            <a href="/docs" className="hover:text-slate-900 transition-colors touch-manipulation">Documentation</a>
            <a href="mailto:smart.track.appp@gmail.com" className="hover:text-slate-900 transition-colors touch-manipulation">Contact Support</a>
          </div>
          <p className="mt-6 sm:mt-8 text-[10px] sm:text-xs text-slate-400">© {new Date().getFullYear()} SmarTrack Intelligence. All rights reserved.</p>
        </div>
      </section>

    </div>
  )
}

export default LoginPage
