import React, { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Chrome, ArrowRight, ChevronUp, ScanLine, ShieldCheck, LayoutGrid } from 'lucide-react'
import { useMobileOptimizations } from '../hooks/useMobileOptimizations'

// Scroll to Top Button Component
const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500)
    }
    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:hidden"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// Animation variants for scroll reveal
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
}

// Feature Pillar Component with card lift effect
const FeaturePillar: React.FC<{
  icon: React.ReactNode
  title: string
  description: string
  index: number
}> = ({ icon, title, description, index }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={fadeInUp}
    transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-6 sm:p-8 hover:border-blue-200 hover:shadow-xl transition-all duration-300 cursor-default group overflow-hidden"
  >
    <div className="relative">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 sm:mb-5 transition-colors">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{description}</p>
    </div>
  </motion.div>
)

export const LoginPage: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const { prefersReducedMotion } = useMobileOptimizations()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block h-10 w-10 border-4 border-slate-200 border-t-blue-600 rounded-full mb-4"
          />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  const shouldAnimate = !prefersReducedMotion

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to Content Link for Accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Scroll to Top Button - Mobile Only */}
      <ScrollToTopButton />

      {/* Top Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <img 
              src="/logo.svg" 
              alt="SmarTrack" 
              className="h-7 sm:h-8 w-auto cursor-pointer" 
            />
            
            {/* Install Extension Button */}
            <button
              onClick={() => loginWithRedirect()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/25"
            >
              <Chrome className="w-4 h-4" />
              Install Extension
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="main-content" className="relative overflow-hidden" tabIndex={-1}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Headline */}
            <motion.h1
              variants={staggerItem}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-4 sm:mb-6 leading-tight tracking-tight"
            >
              Stop Losing Insights to the Feed.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-2"
            >
              Centralize your research from LinkedIn, X, and the Open Web into one searchable intelligence hub. Capture the context, not just the link.
            </motion.p>

            {/* CTA */}
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center gap-3 sm:gap-4 mb-4 px-2"
            >
              <motion.button
                onClick={() => loginWithRedirect()}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 text-base sm:text-lg"
              >
                <Chrome className="w-5 h-5" />
                <span>Install Chrome Extension</span>
              </motion.button>
              <motion.p
                variants={staggerItem}
                transition={{ duration: 0.5 }}
                className="text-xs sm:text-sm text-slate-500"
              >
                Free forever for personal use
              </motion.p>
            </motion.div>

            {/* Dashboard Screenshot */}
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 sm:mt-16"
            >
              <div className="relative max-w-5xl mx-auto">
                {/* Gradient border effect */}
                <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-br from-blue-400/20 via-slate-200/40 to-blue-400/20 blur-sm" />
                
                {/* Shadow container */}
                <div className="absolute inset-0 rounded-xl shadow-2xl shadow-slate-900/20" />
                
                {/* Image container */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200/60 bg-white">
                  <img 
                    src="/3_dashboard_view.png" 
                    alt="SmarTrack Dashboard showing unified intelligence hub with grid layout, platform cards, and unified search interface"
                    className="w-full h-auto block"
                    onError={() => {
                      console.warn('Dashboard image not found. Please ensure /3_dashboard_view.png exists in /public folder.');
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-slate-50 py-20 sm:py-24 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Your Knowledge is Fragmented.
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-2">
              You save a chart on LinkedIn. You bookmark a report on Chrome. But when you need them, they're buried by algorithms. If you can't find it, you didn't save it.
            </p>
          </motion.div>

          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-10 sm:mt-12"
          >
            <div className="relative max-w-5xl mx-auto">
              {/* Gradient border effect */}
              <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-br from-slate-300/30 via-slate-200/20 to-slate-300/30 blur-sm" />
              
              {/* Shadow container */}
              <div className="absolute inset-0 rounded-xl shadow-xl shadow-slate-900/10" />
              
              {/* Image container */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200/60 bg-white">
                <img 
                  src="/Silo%20vs%20Hub.jpg" 
                  alt="Diagram showing the problem of fragmented knowledge silos vs unified SmarTrack hub - Before: Your insights are trapped in someone else's app. After: One source of truth for everything you know."
                  className="w-full h-auto block"
                  onError={(e) => {
                    // Try alternative paths if URL encoded doesn't work
                    const target = e.target as HTMLImageElement;
                    const currentSrc = target.src;
                    if (currentSrc.includes('%20')) {
                      target.src = '/Silo vs Hub.jpg';
                    } else if (currentSrc.includes('Silo vs Hub')) {
                      target.src = '/Silo-vs-Hub.jpg';
                    } else {
                      console.warn('Silo vs Hub image not found. Please add the image to /public folder with one of these names: "Silo vs Hub.jpg", "Silo-vs-Hub.jpg", or "Silo%20vs%20Hub.jpg"');
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-white py-20 sm:py-24 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Escape the Walled Gardens.
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-2">
              SmarTrack is the bridge between your social feeds and your personal library.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
            <FeaturePillar
              icon={<ScanLine className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Capture"
              description="Extract full context—author, image, and text."
              index={0}
            />
            <FeaturePillar
              icon={<ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Sanitize"
              description="Strip tracking pixels locally on your device."
              index={1}
            />
            <FeaturePillar
              icon={<LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Centralize"
              description="Insights land in one unified dashboard."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section id="features" className="py-20 sm:py-24 md:py-28 bg-gradient-to-b from-white to-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
            {/* Visual Recall Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-6 sm:p-8 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="mb-6 rounded-xl overflow-hidden">
                <img 
                  src="/1_save_link_popup.png" 
                  alt="Extension popup showing visual recall features"
                  className="w-full h-auto rounded-xl group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/image_01344c.png';
                  }}
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                Don't just save the URL. Capture the thumbnail, author, and summary.
              </h3>
            </motion.div>

            {/* Platform Agnostic Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-6 sm:p-8 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="mb-6 rounded-xl overflow-hidden">
                <img 
                  src="/2_category_selection.png" 
                  alt="Platform logos showing universal support"
                  className="w-full h-auto rounded-xl group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('2_category_selection')) {
                      target.src = '/image_50adcc.png';
                    }
                  }}
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                Treat LinkedIn like the Open Web. PDF, Tweet, or Post—it all lives in one hub.
              </h3>
            </motion.div>

            {/* Workflow Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-6 sm:p-8 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="mb-6 rounded-xl overflow-hidden">
                <img 
                  src="/3_dashboard_view.png" 
                  alt="List view showing research workflow"
                  className="w-full h-auto rounded-xl group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('3_dashboard_view')) {
                      target.src = '/image_00bf70.png';
                    }
                  }}
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                Built for Researchers. Track competitors, build swipe files, and recall prospect details.
              </h3>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Privacy Section */}
      <section className="relative bg-slate-900 py-20 lg:py-28 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6"
            >
              Intelligence Without Intrusion.
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 sm:mb-12"
            >
              Most tools demand passwords. SmarTrack is different. We use a Client-First Architecture. The capture happens locally on your device. We never see your session data.
            </motion.p>
            
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            >
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-sm sm:text-base font-medium text-white">No Data Selling</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-sm sm:text-base font-medium text-white">Client-Side Encryption</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-sm sm:text-base font-medium text-white">Zero-Trust</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative bg-white py-20 sm:py-24 md:py-28 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6"
            >
              Reclaim Your Digital Memory.
            </motion.h2>
            <motion.div
              variants={fadeInScale}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.button
                onClick={() => loginWithRedirect()}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xl shadow-blue-600/30 transition-all duration-300 text-base sm:text-lg"
              >
                <Chrome className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Add to Chrome - It's Free</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            {/* Links - Mobile: 2 columns, Desktop: row */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-sm text-slate-500">
              <Link to="/docs" className="hover:text-slate-900 transition-colors">Docs</Link>
              <Link to="/faq" className="hover:text-slate-900 transition-colors">FAQ</Link>
              <Link to="/legal" className="hover:text-slate-900 transition-colors">Legal</Link>
              <a href="mailto:smart.track.appp@gmail.com" className="hover:text-slate-900 transition-colors">Contact</a>
            </div>
            {/* Copyright */}
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="SmarTrack" className="h-5 sm:h-6 w-auto" />
              <span className="text-slate-400 text-xs sm:text-sm">© {new Date().getFullYear()} SmarTrack</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
