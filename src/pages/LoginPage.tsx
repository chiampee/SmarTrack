import React, { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Cloud, Zap, BookOpen, Search, Tag, Link2, Brain, BarChart3, Clock, Lock, CheckCircle2, ArrowRight, Star, LogIn } from 'lucide-react'
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
      whileHover={{ scale: 1.05, y: -8 }}
      className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
    >
    <motion.div 
      className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white w-fit mb-4"
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {icon}
    </motion.div>
      <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
      <p className="text-sm text-purple-200 mb-2 leading-relaxed">{description}</p>
      {benefit && (
        <p className="text-xs text-blue-300 font-medium flex items-center gap-1 mt-3">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block rounded-full h-12 w-12 border-b-2 border-white mb-4"
          />
          <p className="text-purple-200">Loading...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/2 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl"
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
          
          {/* Sign In Button */}
          <motion.button
            onClick={() => loginWithRedirect()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 text-white font-semibold rounded-xl transition-all duration-300"
          >
            <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign In</span>
          </motion.button>
          </div>
      </motion.nav>

      <div className="relative z-10">
        {/* Hero Section with Primary CTA */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: animationConfig.duration, ease: "easeOut" }}
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-24 sm:pb-32"
          >
            <div className="text-center">
              {/* Headline - Clear & Compelling */}
              <motion.h1
                initial={shouldAnimate ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: animationConfig.duration, delay: shouldAnimate ? 0.1 : 0, ease: "easeOut" }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 sm:mb-8 max-w-5xl mx-auto leading-tight px-4"
              >
                Never Lose Research Again.
                <motion.span
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"
                >
                  Find Everything Instantly.
                </motion.span>
              </motion.h1>
              
              {/* Value Proposition - Authentic & Clear */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg sm:text-xl md:text-2xl text-purple-200 mb-4 sm:mb-6 max-w-3xl mx-auto font-medium px-4"
              >
                The research tool that helps you <span className="text-white font-bold">organize, analyze, and find</span> everything you save
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-base sm:text-lg text-purple-300 mb-10 sm:mb-12 max-w-2xl mx-auto px-4"
              >
                Save any webpage instantly. Get AI-powered summaries. Search your entire research library in seconds.
              </motion.p>
          
              {/* Primary CTA - More Prominent */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-10"
              >
                <motion.button
                  onClick={() => loginWithRedirect()}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/50 text-lg sm:text-xl mb-4 relative overflow-hidden"
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
                  <span className="relative z-10">Get Started Free — No Credit Card</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5 relative z-10" />
                  </motion.div>
                </motion.button>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="flex flex-wrap justify-center items-center gap-4 text-sm text-purple-300"
                >
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
                </motion.div>
              </motion.div>

              {/* Value Badge - Authentic */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-purple-200 mb-12"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Start organizing your research <span className="text-white font-semibold">today</span></span>
              </motion.div>
        </div>

            {/* Extension Preview - Save Flow */}
            <motion.div
              initial={shouldAnimate ? "hidden" : "visible"}
              whileInView="visible"
              viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.3 }}
              variants={fadeInScale}
              transition={{ duration: animationConfig.duration, ease: "easeOut" }}
              className="mt-20 sm:mt-24 mb-16 sm:mb-20 max-w-5xl mx-auto px-4"
            >
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center mb-10"
              >
                <h3 className="text-3xl font-bold text-white mb-3">How It Works: Save Links in 3 Simple Steps</h3>
                <p className="text-lg text-purple-200 max-w-2xl mx-auto">
                  Our browser extension makes saving research links effortless. Watch how easy it is to capture and organize any webpage.
                </p>
              </motion.div>
              <motion.div
                variants={fadeInScale}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative rounded-2xl border-2 border-white/20 shadow-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-4 sm:p-8"
              >
                <ExtensionPreview />
              </motion.div>
            </motion.div>

            {/* Product Preview - Dashboard Preview */}
            <motion.div
              initial={shouldAnimate ? "hidden" : "visible"}
              whileInView="visible"
              viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: animationConfig.duration, ease: "easeOut" }}
              className="mt-20 sm:mt-24 mb-16 sm:mb-20 max-w-6xl mx-auto px-4"
            >
              <div className="relative rounded-2xl border-2 border-white/20 shadow-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-4">
                <div className="relative bg-slate-900 rounded-2xl w-full">
                  <img 
                    src="/dashboard-screenshot.png" 
                    alt="SmarTrack Research Dashboard - Organize your research with AI-powered tools"
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
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Key Features - Shorter, Benefit-Focused */}
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
              Everything You Need to Master Research
            </h2>
            <p className="text-lg sm:text-xl text-purple-300 max-w-2xl mx-auto px-4">
              Powerful features designed to make research effortless
            </p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            <Feature
              icon={<BookOpen className="w-6 h-6" />}
              title="One-Click Save"
              description="Save any webpage instantly with our browser extension. Automatically extracts content, title, and metadata."
              benefit="Never lose important research again"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
            <Feature
              icon={<Brain className="w-6 h-6" />}
              title="AI-Powered Summaries"
              description="Get instant summaries and key insights. Understand documents at a glance without reading everything."
              benefit="Understand content faster"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
            <Feature
              icon={<Tag className="w-6 h-6" />}
              title="Smart Organization"
              description="AI automatically categorizes and tags your research. Create collections and stay organized effortlessly."
              benefit="Organize without the manual work"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
            <Feature
              icon={<Search className="w-6 h-6" />}
              title="Lightning-Fast Search"
              description="Search across titles, content, tags, and summaries. Find exactly what you need instantly."
              benefit="Find anything in seconds"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
            <Feature
              icon={<Cloud className="w-6 h-6" />}
              title="Cloud Sync"
              description="Access your research library from any device. All your data syncs automatically and securely."
              benefit="Access from anywhere"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
            <Feature
              icon={<Shield className="w-6 h-6" />}
              title="Privacy First"
              description="Your data is encrypted and secure. GDPR compliant. Your research stays private and yours."
              benefit="Your data, your control"
              animationConfig={animationConfig}
              isMobile={isMobile}
            />
          </motion.div>
        </motion.div>

        {/* Stats - Enhanced Visual Design */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
          variants={staggerContainer}
          className="mb-24 sm:mb-32 py-16 sm:py-20 border-t border-white/10"
        >
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
              Built for Speed & Scale
            </h2>
            <p className="text-lg sm:text-xl text-purple-300 px-4">Fast, powerful, and unlimited</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4"
          >
            {[
              { icon: <Link2 className="w-8 h-8" />, value: '∞', label: 'Unlimited Saves', bgClass: 'from-blue-500/10 to-purple-500/10', borderClass: 'border-blue-500/20', iconClass: 'text-blue-400' },
              { icon: <BarChart3 className="w-8 h-8" />, value: '<2s', label: 'AI Analysis', bgClass: 'from-purple-500/10 to-pink-500/10', borderClass: 'border-purple-500/20', iconClass: 'text-purple-400' },
              { icon: <Clock className="w-8 h-8" />, value: '<1s', label: 'Search Speed', bgClass: 'from-green-500/10 to-blue-500/10', borderClass: 'border-green-500/20', iconClass: 'text-green-400' },
              { icon: <Shield className="w-8 h-8" />, value: '100%', label: 'Your Data', bgClass: 'from-orange-500/10 to-red-500/10', borderClass: 'border-orange-500/20', iconClass: 'text-orange-400' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`text-center p-6 rounded-2xl bg-gradient-to-br ${stat.bgClass} border ${stat.borderClass}`}
              >
                <div className={`flex justify-center mb-3 ${stat.iconClass}`}>{stat.icon}</div>
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: index * 0.1 }}
                  className="text-4xl font-extrabold text-white mb-2"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-purple-200 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Use Cases - More Scannable */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
          variants={staggerContainer}
          className="mb-24 sm:mb-32 py-16 sm:py-20 border-t border-white/10"
        >
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
              Built for Knowledge Workers
            </h2>
            <p className="text-lg sm:text-xl text-purple-300 px-4">Perfect for anyone who needs to organize and find research quickly</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto px-4"
          >
            {[
              { role: 'Academic Researchers', task: 'Papers, findings, bibliographies', icon: '🎓' },
              { role: 'PhD Students', task: 'Literature reviews, citations', icon: '📚' },
              { role: 'Journalists', task: 'Research, fact-checking, archives', icon: '📰' },
              { role: 'Content Creators', task: 'Inspiration, competitors, ideas', icon: '✍️' },
              { role: 'Product Managers', task: 'Features, competitors, trends', icon: '🚀' },
              { role: 'Lawyers', task: 'Case law, precedents, key points', icon: '⚖️' },
            ].map((item, index) => (
              <motion.div
                key={item.role}
                variants={staggerItem}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.03, y: -3 }}
                className="p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h4 className="font-bold text-white mb-1.5 text-lg">{item.role}</h4>
                <p className="text-sm text-purple-300">{item.task}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* How It Works - Visual Flow */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.2 }}
          variants={staggerContainer}
          className="mb-24 sm:mb-32 py-16 sm:py-20 border-t border-white/10"
        >
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-lg sm:text-xl text-purple-300 px-4">From signup to saving your first link in under 2 minutes</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto px-4"
          >
            {[
              { step: '1', title: 'Sign Up Free', desc: 'Create account in 30 seconds. No credit card needed.', icon: <Lock className="w-5 h-5" /> },
              { step: '2', title: 'Save Links', desc: 'Install extension and save any webpage with one click.', icon: <Link2 className="w-5 h-5" /> },
              { step: '3', title: 'AI Analyzes', desc: 'Get instant summaries and auto-categorization.', icon: <Brain className="w-5 h-5" /> },
              { step: '4', title: 'Find Instantly', desc: 'Search and discover your research in seconds.', icon: <Search className="w-5 h-5" /> },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                variants={staggerItem}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative"
              >
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -z-10" style={{ width: 'calc(100% - 4rem)', left: 'calc(50% + 2rem)' }}></div>
                )}
                <div className="text-center p-6 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all h-full">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="bg-gradient-to-br from-blue-500 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg"
                  >
                    {item.step}
                  </motion.div>
                  <h4 className="font-bold text-white mb-2 text-lg">{item.title}</h4>
                  <p className="text-sm text-purple-300 leading-relaxed">{item.desc}</p>
              </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Final CTA - Authentic & Compelling */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: isMobile ? "0px" : "-100px", amount: 0.3 }}
          variants={fadeInScale}
          className="mb-16 sm:mb-24 py-20 sm:py-24 px-4"
        >
          <div className="relative text-center bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-3xl p-8 sm:p-12 md:p-16 border-2 border-white/20 shadow-2xl overflow-hidden max-w-5xl mx-auto">
            <motion.div
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10"
              style={{ backgroundSize: '200% 200%' }}
            />
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 text-sm text-purple-200">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>Start organizing your research today</span>
            </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 sm:mb-8 max-w-3xl mx-auto leading-tight px-4">
                Ready to Transform Your Research?
              </h2>
              <p className="text-lg sm:text-xl text-purple-200 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
                Join researchers who never lose track of their work. Get started in 30 seconds.
              </p>
              <motion.button
                onClick={() => loginWithRedirect()}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/50 text-lg sm:text-xl mb-4 relative overflow-hidden group"
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
              <p className="text-sm text-purple-300">No credit card required • Free forever • Setup in 30 seconds</p>
            </motion.div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  )
}
