import React, { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Cloud, Zap, BookOpen, Search, Tag, Link2, Brain, BarChart3, Clock, Lock, CheckCircle2, ArrowRight, Star, LogIn, Cpu, FileText, Network, Database, Command, Sparkles, Target, Briefcase, TrendingUp, Users, HelpCircle, ChevronDown, Github, Twitter, Mail } from 'lucide-react'
import { DashboardPreview } from '../components/DashboardPreview'
import { ExtensionPreview } from '../components/ExtensionPreview'
import { useMobileOptimizations } from '../hooks/useMobileOptimizations'

// Animation variants - Optimized for mobile
const createAnimationVariants = (config: { movementDistance: number; scaleAmount: number; staggerDelay: number }) => ({
  fadeInUp: {
    hidden: { opacity: 0, y: config.movementDistance },
    visible: { 
      opacity: 1, 
      y: 0
    }
  },
  fadeInScale: {
    hidden: { opacity: 0, scale: config.scaleAmount },
    visible: { 
      opacity: 1, 
      scale: 1
    }
  },
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: config.staggerDelay,
        delayChildren: 0.05
      }
    }
  },
  staggerItem: {
    hidden: { opacity: 0, y: config.movementDistance * 0.6 },
    visible: {
      opacity: 1,
      y: 0
    }
  }
})

const Feature: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  benefit?: string;
  animationConfig: { duration: number; staggerDelay: number; movementDistance: number };
  isMobile: boolean;
}> = ({
  icon,
  title,
  description,
  benefit,
  animationConfig,
  isMobile
}) => {
  const staggerItem = {
    hidden: { opacity: 0, y: animationConfig.movementDistance * 0.6 },
    visible: {
      opacity: 1,
      y: 0
    }
  }
  
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: isMobile ? "-20px" : "-50px" }}
      variants={staggerItem}
      transition={{ duration: animationConfig.duration, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group p-6 rounded-2xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10"
    >
    <motion.div 
      className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl text-white w-fit mb-4 shadow-lg shadow-indigo-500/25"
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {icon}
    </motion.div>
      <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
      <p className="text-sm text-slate-300 mb-2 leading-relaxed">{description}</p>
      {benefit && (
        <p className="text-xs text-indigo-400 font-medium flex items-center gap-1 mt-3">
          <CheckCircle2 className="w-3 h-3" />
          {benefit}
        </p>
      )}
    </motion.div>
  )
}

export const LoginPage: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const { isMobile, prefersReducedMotion, animationConfig } = useMobileOptimizations()

  // Validate authentication state - redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"
          />
          <p className="text-slate-300">Loading...</p>
        </motion.div>
      </div>
    )
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  // Create animation variants based on device
  const variants = createAnimationVariants(animationConfig)
  const fadeInUp = variants.fadeInUp
  const fadeInScale = variants.fadeInScale
  const staggerContainer = variants.staggerContainer
  const staggerItem = variants.staggerItem

  // Disable animations if user prefers reduced motion
  const shouldAnimate = !prefersReducedMotion

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Effects - Minimal & Professional */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/2 left-0 w-72 h-72 bg-slate-600/5 rounded-full blur-3xl"
        />
      </div>

      {/* Top Navigation Header */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center"
          >
            <img 
              src="/logo.svg" 
              alt="SmarTrack" 
              className="h-10 sm:h-12 w-auto"
            />
          </motion.div>
          
          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button 
              onClick={() => document.getElementById('dashboard-preview-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Features
            </button>
            <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          
          {/* Sign In Button */}
          <motion.button
            onClick={() => loginWithRedirect()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur-sm border border-slate-600 hover:border-indigo-500/50 text-slate-200 font-semibold rounded-xl transition-all duration-300"
          >
            <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign In</span>
          </motion.button>
          </div>
      </motion.nav>

      <div className="relative z-10">
        {/* Hero Section with Primary CTA */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-transparent"></div>
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: animationConfig.duration, ease: "easeOut" }}
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-24 sm:pb-32"
          >
            <div className="text-center">
              {/* Headline - Clear Value Proposition */}
              <motion.h1
                initial={shouldAnimate ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: animationConfig.duration, delay: shouldAnimate ? 0.1 : 0, ease: "easeOut" }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 sm:mb-8 max-w-5xl mx-auto leading-tight px-4"
              >
                Save Any Webpage.
                <motion.span
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="block mt-2 bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent"
                >
                  Find It Instantly.
                </motion.span>
              </motion.h1>
              
              {/* Value Proposition - Clear & Benefit-Focused */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-4 sm:mb-6 max-w-3xl mx-auto font-medium px-4"
              >
                A Chrome extension that <span className="text-white font-bold">saves, summarizes, and organizes</span> everything you read online—so you never lose that important article again.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-base sm:text-lg text-slate-400 mb-10 sm:mb-12 max-w-2xl mx-auto px-4"
              >
                One click to save. AI summaries in seconds. Search your entire library instantly.
              </motion.p>
          
              {/* Primary CTA - Clear & Honest */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <motion.button
                  onClick={() => loginWithRedirect()}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 text-lg sm:text-xl relative overflow-hidden"
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                  />
                  <Zap className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Start Free — No Credit Card</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5 relative z-10" />
                  </motion.div>
                </motion.button>
                <motion.button
                  onClick={() => {
                    const howItWorks = document.getElementById('how-it-works-section')
                    howItWorks?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur-sm border border-slate-600 hover:border-indigo-500/50 text-slate-200 font-semibold rounded-xl text-lg transition-all duration-300"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>See How It Works</span>
                </motion.button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm text-slate-400 mb-8"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Free forever
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Works on Chrome
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  AI-powered summaries
                </span>
              </motion.div>

              {/* Social Proof Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50 text-sm text-slate-300 mb-12"
              >
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800">R</div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800">P</div>
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800">M</div>
                </div>
                <span>Trusted by <span className="text-white font-semibold">researchers, analysts & professionals</span></span>
              </motion.div>
        </div>

            {/* How It Works - Moved Up for Better Flow */}
            <motion.div
              id="how-it-works-section"
              initial={shouldAnimate ? "hidden" : "visible"}
              whileInView="visible"
              viewport={{ once: false, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
              variants={staggerContainer}
              className="mt-16 sm:mt-20 mb-16 sm:mb-20 max-w-5xl mx-auto px-4"
            >
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center mb-10"
              >
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3">How It Works</h3>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  From webpage to searchable knowledge in 4 simple steps
                </p>
              </motion.div>
              <motion.div
                variants={staggerContainer}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                {[
                  { step: '1', title: 'Save', desc: 'Click the extension or use keyboard shortcut on any page', icon: <Link2 className="w-5 h-5" /> },
                  { step: '2', title: 'Summarize', desc: 'AI creates instant summaries and extracts key points', icon: <Sparkles className="w-5 h-5" /> },
                  { step: '3', title: 'Organize', desc: 'Auto-categorized into your projects and collections', icon: <Tag className="w-5 h-5" /> },
                  { step: '4', title: 'Find', desc: 'Search everything instantly with smart filters', icon: <Search className="w-5 h-5" /> },
                ].map((item, idx) => (
                  <motion.div
                    key={item.step}
                    variants={staggerItem}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center p-5 sm:p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl"
                  >
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                      {item.step}
                    </div>
                    <h4 className="font-bold text-white mb-1.5 text-lg">{item.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Extension Preview - See It In Action */}
            <motion.div
              initial={shouldAnimate ? "hidden" : "visible"}
              whileInView="visible"
              viewport={{ once: false, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
              variants={fadeInScale}
              transition={{ duration: animationConfig.duration * 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-16 sm:mt-20 mb-16 sm:mb-20 max-w-5xl mx-auto px-4"
            >
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center mb-10"
              >
                <h3 className="text-3xl font-bold text-white mb-3">See It In Action</h3>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  Save any webpage with one click. Your content is automatically organized and ready to search.
                </p>
              </motion.div>
              <motion.div
                variants={fadeInScale}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative rounded-2xl border-2 border-slate-700/50 shadow-2xl shadow-indigo-500/5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-4 sm:p-8"
              >
                <ExtensionPreview />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Key Features - Clear Benefits */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
          variants={staggerContainer}
          className="mb-24 sm:mb-32 py-16 sm:py-20"
        >
              <motion.div
                variants={fadeInUp}
                transition={{ duration: animationConfig.duration, ease: "easeOut" }}
                className="text-center mb-12 sm:mb-16"
              >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
              Everything You Need to Stay Organized
            </h2>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto px-4">
              Powerful features that make saving and finding research effortless
            </p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto"
          >
            <Feature
              icon={<Link2 className="w-6 h-6" />}
              title="Save Any Webpage"
              description="One click to save articles, docs, tweets, videos, or any webpage. Works on every site, captures the full content automatically."
              benefit="Never lose important content again"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
            <Feature
              icon={<Brain className="w-6 h-6" />}
              title="AI Summaries"
              description="Get instant summaries and key takeaways from any article. Understand long reads in seconds without reading the whole thing."
              benefit="Save hours of reading time"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
            <Feature
              icon={<Tag className="w-6 h-6" />}
              title="Auto-Organization"
              description="AI automatically tags and categorizes your saves. Create collections, add notes, and keep everything organized without manual effort."
              benefit="Zero-effort organization"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
            <Feature
              icon={<Search className="w-6 h-6" />}
              title="Instant Search"
              description="Find any saved content in under a second. Search by title, content, tags, or your own notes. Your knowledge base, always at your fingertips."
              benefit="Find anything instantly"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
          </motion.div>
        </motion.div>

        {/* Why SmarTrack - Trust Signals */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
          variants={staggerContainer}
          className="mb-24 sm:mb-32 py-16 sm:py-20 border-t border-slate-700/50"
        >
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
              Why Choose SmarTrack?
            </h2>
            <p className="text-lg sm:text-xl text-slate-400 px-4">Built for speed, privacy, and reliability</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4"
          >
            {[
              { icon: <Zap className="w-8 h-8" />, value: 'Fast', label: 'AI summaries in seconds', bgClass: 'from-indigo-500/10 to-indigo-600/10', borderClass: 'border-indigo-500/20', iconClass: 'text-indigo-400' },
              { icon: <Shield className="w-8 h-8" />, value: 'Private', label: 'Your data stays yours', bgClass: 'from-slate-600/10 to-indigo-500/10', borderClass: 'border-slate-600/30', iconClass: 'text-slate-300' },
              { icon: <Cloud className="w-8 h-8" />, value: 'Synced', label: 'Access from anywhere', bgClass: 'from-indigo-500/10 to-slate-600/10', borderClass: 'border-indigo-500/20', iconClass: 'text-indigo-400' },
              { icon: <CheckCircle2 className="w-8 h-8" />, value: 'Free', label: 'No credit card needed', bgClass: 'from-emerald-500/10 to-emerald-600/10', borderClass: 'border-emerald-500/20', iconClass: 'text-emerald-400' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`text-center p-6 rounded-2xl bg-gradient-to-br ${stat.bgClass} border ${stat.borderClass} backdrop-blur-sm`}
              >
                <div className={`flex justify-center mb-3 ${stat.iconClass}`}>{stat.icon}</div>
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: index * 0.1 }}
                  className="text-2xl font-extrabold text-white mb-1"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Target Audience - Who It's For */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
          variants={staggerContainer}
          className="mb-24 sm:mb-32 py-16 sm:py-20 border-t border-slate-700/50"
        >
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
              Perfect For Anyone Who Reads Online
            </h2>
            <p className="text-lg sm:text-xl text-slate-400 px-4">Whether you're researching, learning, or just reading—we've got you covered</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto px-4"
          >
            {[
              { role: 'Researchers & Students', task: 'Save papers, articles, and sources. Build your bibliography effortlessly.', icon: <BookOpen className="w-6 h-6" />, emoji: '📚' },
              { role: 'Professionals', task: 'Track industry news, competitor updates, and important reports.', icon: <Briefcase className="w-6 h-6" />, emoji: '💼' },
              { role: 'Content Creators', task: 'Collect inspiration, references, and ideas for your next project.', icon: <Sparkles className="w-6 h-6" />, emoji: '✨' },
              { role: 'Developers', task: 'Save documentation, tutorials, and Stack Overflow answers.', icon: <Cpu className="w-6 h-6" />, emoji: '💻' },
              { role: 'Curious Minds', task: 'Build a personal library of everything interesting you find online.', icon: <Brain className="w-6 h-6" />, emoji: '🧠' },
              { role: 'Teams', task: 'Share research, collaborate on collections, and build shared knowledge.', icon: <Users className="w-6 h-6" />, emoji: '👥' },
            ].map((item, index) => (
              <motion.div
                key={item.role}
                variants={staggerItem}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.02, y: -3 }}
                className="p-5 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:border-indigo-500/30 transition-all duration-300 group flex gap-4"
              >
                <div className="text-3xl flex-shrink-0">{item.emoji}</div>
                <div>
                  <h4 className="font-bold text-white mb-1 text-base">{item.role}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.task}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard Preview - Your Library */}
        <motion.div
          id="dashboard-preview-section"
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
          variants={fadeInUp}
          className="mb-24 sm:mb-32 py-16 sm:py-20 border-t border-slate-700/50"
        >
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
              Your Personal Knowledge Library
            </h2>
            <p className="text-lg sm:text-xl text-slate-400 px-4">Everything you save, searchable and organized in one beautiful dashboard</p>
          </motion.div>
          <div className="relative rounded-2xl border-2 border-slate-700/50 shadow-2xl shadow-indigo-500/5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-4 max-w-6xl mx-auto">
            <div className="relative bg-slate-900 rounded-2xl w-full">
              <img 
                src="/dashboard-screenshot.png" 
                alt="SmarTrack Dashboard - Your organized knowledge library"
                className="w-full h-auto rounded-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = document.getElementById('dashboard-preview-fallback')
                  if (fallback) fallback.style.display = 'block'
                }}
              />
              <div id="dashboard-preview-fallback" style={{ display: 'none' }}>
                <DashboardPreview />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final CTA - Clear & Compelling */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.3 }}
          variants={fadeInScale}
          className="mb-16 sm:mb-24 py-20 sm:py-24 px-4"
        >
          <div className="relative text-center bg-gradient-to-br from-slate-800/60 via-indigo-900/20 to-slate-800/60 backdrop-blur-sm rounded-3xl p-8 sm:p-12 md:p-16 border-2 border-slate-700/50 shadow-2xl shadow-indigo-500/5 overflow-hidden max-w-4xl mx-auto">
            <motion.div
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-slate-600/5 to-indigo-600/5"
              style={{ backgroundSize: '200% 200%' }}
            />
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative z-10"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 max-w-3xl mx-auto leading-tight px-4">
                Ready to Stop Losing What You Read?
              </h2>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
                Join thousands of users who save and organize their online reading. Start for free in 30 seconds.
              </p>
              <motion.button
                onClick={() => loginWithRedirect()}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 text-lg sm:text-xl mb-4 relative overflow-hidden group"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                />
                <Zap className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Get Started Free</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <p className="text-sm text-slate-400">No credit card required • Free forever • Works on Chrome</p>
            </motion.div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
          variants={staggerContainer}
          className="mb-16 sm:mb-24 py-16 sm:py-20 border-t border-slate-700/50"
        >
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 px-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-400 px-4">Got questions? We've got answers.</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="max-w-3xl mx-auto px-4 space-y-4"
          >
            {[
              { q: 'Is SmarTrack really free?', a: 'Yes! SmarTrack is completely free to use. No credit card required, no hidden fees. We believe everyone should have access to better research tools.' },
              { q: 'Which browsers are supported?', a: 'Currently, SmarTrack works on Google Chrome and Chromium-based browsers (Edge, Brave, Arc). Firefox and Safari support coming soon.' },
              { q: 'How does the AI summarization work?', a: 'When you save a page, our AI reads the content and generates a concise summary with key takeaways. This happens automatically in seconds.' },
              { q: 'Is my data private?', a: 'Absolutely. Your saved content is encrypted and stored securely. We never sell your data or share it with third parties. You own your data.' },
              { q: 'Can I export my saved content?', a: 'Yes! You can export all your saves as JSON or Markdown anytime. Your data is always portable.' },
              { q: 'What keyboard shortcut saves a page?', a: 'Use Cmd+Shift+S on Mac or Ctrl+Shift+S on Windows to instantly save the current page.' },
            ].map((faq, index) => (
              <motion.details
                key={index}
                variants={staggerItem}
                className="group bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-800/60 transition-colors">
                  <span className="font-medium text-white pr-4">{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </motion.div>
        </motion.div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <img src="/logo.svg" alt="SmarTrack" className="h-8 w-auto mb-4" />
                <p className="text-sm text-slate-400 mb-4">
                  Save, summarize, and organize everything you read online.
                </p>
                <div className="flex gap-3">
                  <a href="https://twitter.com/smartrack" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="https://github.com/smartrack" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                  <a href="mailto:hello@smartrack.app" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              {/* Product */}
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-white transition-colors">How It Works</button></li>
                  <li><button onClick={() => document.getElementById('dashboard-preview-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-400 hover:text-white transition-colors">Features</button></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Chrome Extension</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              
              {/* Resources */}
              <div>
                <h4 className="font-semibold text-white mb-4">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Changelog</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API Docs</a></li>
                </ul>
              </div>
              
              {/* Legal */}
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} SmarTrack. All rights reserved.
              </p>
              <p className="text-sm text-slate-500">
                Made with ❤️ for researchers everywhere
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
