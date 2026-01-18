import React, { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Chrome, FileText, FolderTree, Search, ArrowRight, CheckCircle2, LogIn, BookOpen, ExternalLink, Sparkles, ChevronUp, Link2 } from 'lucide-react'
import { DashboardPreview } from '../components/DashboardPreview'
import { ExtensionPreview } from '../components/ExtensionPreview'
import { useMobileOptimizations } from '../hooks/useMobileOptimizations'
import { LinkedInLogo, XLogo, RedditLogo, WebIcon, PDFIcon } from '../components/BrandLogos'

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
            
            {/* Sign In Button */}
            <button
              onClick={() => loginWithRedirect()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all"
            >
              <LogIn className="w-4 h-4" />
              Sign In
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
            {/* Badge */}
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-full text-xs sm:text-sm text-blue-700 font-medium mb-6 sm:mb-8"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Research Management Tool
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={staggerItem}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-4 sm:mb-6 leading-tight tracking-tight"
            >
              Your Personal Web Archive.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-2"
            >
              A centralized library for your reading list. Capture content from any tab, auto-organize with AI, and search your archive instantly.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10 px-2"
            >
              <motion.button
                onClick={() => loginWithRedirect()}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 text-base sm:text-lg"
              >
                <Chrome className="w-5 h-5" />
                <span>Install Chrome Extension</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => loginWithRedirect()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-base sm:text-lg"
              >
                <LogIn className="w-5 h-5" />
                Go to Dashboard
              </motion.button>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500"
            >
              {[
                { text: 'Instant setup', icon: CheckCircle2 },
                { text: 'No credit card', icon: CheckCircle2 },
                { text: 'Privacy-first', icon: CheckCircle2 }
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-1.5 sm:gap-2">
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  {item.text}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Platform Support Section */}
      <section className="bg-gradient-to-b from-white to-slate-50/80 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              Supported Platforms
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto px-2">
              Optimized parsers for the sites you use most.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                name: 'LinkedIn',
                icon: <LinkedInLogo className="w-6 h-6 sm:w-7 sm:h-7" />,
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-600',
                description: 'Posts & Articles'
              },
              {
                name: 'X (Twitter)',
                icon: <XLogo className="w-6 h-6 sm:w-7 sm:h-7" />,
                color: 'from-slate-900 to-slate-800',
                bgColor: 'bg-slate-50',
                textColor: 'text-slate-700',
                description: 'Threads & Tweets'
              },
              {
                name: 'Reddit',
                icon: <RedditLogo className="w-6 h-6 sm:w-7 sm:h-7" />,
                color: 'from-orange-500 to-orange-600',
                bgColor: 'bg-orange-50',
                textColor: 'text-orange-600',
                description: 'Discussions & Posts'
              },
              {
                name: 'Web Pages',
                icon: <WebIcon className="w-6 h-6 sm:w-7 sm:h-7" />,
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50',
                textColor: 'text-green-600',
                description: 'Any Website'
              },
              {
                name: 'PDFs',
                icon: <PDFIcon className="w-6 h-6 sm:w-7 sm:h-7" />,
                color: 'from-red-500 to-red-600',
                bgColor: 'bg-red-50',
                textColor: 'text-red-600',
                description: 'Documents'
              }
            ].map((platform, index) => (
              <motion.div
                key={platform.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-6 sm:p-8 hover:border-slate-300 hover:shadow-xl transition-all duration-300 cursor-default text-center h-full flex flex-col items-center justify-center">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 ${platform.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`${platform.textColor}`}>
                      {platform.icon}
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 sm:mb-2">{platform.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-500">{platform.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-10 sm:mt-12"
          >
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-50 border border-blue-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-sm sm:text-base font-medium text-blue-700">
                All content types supported in one unified dashboard
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Extension Preview Section */}
      <section className="bg-gradient-to-b from-slate-50/80 to-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              Capture without context switching.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
              Save content directly from your active tab without breaking your workflow.
            </p>
          </motion.div>
          <ExtensionPreview />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              How it works
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
              Three core capabilities that transform how you capture, organize, and retrieve information.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <FeaturePillar
              icon={<Chrome className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="One-Click Capture"
              description="Save the current page instantly using the browser extension. Works on LinkedIn, X, Reddit, and any article."
              index={0}
            />
            <FeaturePillar
              icon={<FolderTree className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Automated Sorting"
              description="The AI scans content upon arrival and assigns relevant tags and categories automatically. No manual filing required."
              index={1}
            />
            <FeaturePillar
              icon={<Search className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Natural Language Search"
              description="Retrieve specific links by describing them. Type 'posts about AI agents' to find exact matches."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="demo" className="bg-gradient-to-b from-slate-50/80 to-white border-y border-slate-200/80 py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              Your Knowledge Hub
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
              Everything you capture, searchable, organized, and accessible from any device.
            </p>
          </motion.div>
          <DashboardPreview />
        </div>
      </section>

      {/* Documentation Section */}
      <section id="docs" className="py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              Documentation
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
              Everything you need to get started and make the most of SmarTrack.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />,
                title: 'Installation Guide',
                description: 'Install the extension and save your first page in under 2 minutes.',
                link: '/docs'
              },
              {
                icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
                title: 'Keyboard Shortcuts',
                description: 'Master keyboard shortcuts for faster saving.',
                link: '/docs'
              },
              {
                icon: <Search className="w-5 h-5 sm:w-6 sm:h-6" />,
                title: 'Search Syntax',
                description: 'Learn advanced search operators and techniques.',
                link: '/docs'
              }
            ].map((doc, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={doc.link}
                  className="block bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-6 sm:p-8 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group h-full"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 group-hover:bg-blue-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:text-blue-600 mb-4 sm:mb-5 transition-colors">
                    {doc.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                    {doc.title}
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">{doc.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-slate-900 py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden">
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
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6"
            >
              Start your archive.
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base sm:text-lg text-slate-400 mb-8 sm:mb-10 max-w-2xl mx-auto px-2"
            >
              Free to use. No credit card required.
            </motion.p>
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
                <span>Install Chrome Extension</span>
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
