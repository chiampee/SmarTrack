import React, { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Chrome, FileText, FolderTree, Search, ArrowRight, CheckCircle2, LogIn, BookOpen, ExternalLink, Sparkles } from 'lucide-react'
import { DashboardPreview } from '../components/DashboardPreview'
import { ExtensionPreview } from '../components/ExtensionPreview'
import { useMobileOptimizations } from '../hooks/useMobileOptimizations'

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
    viewport={{ once: true, margin: "-80px" }}
    variants={fadeInUp}
    transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ scale: 1.02, y: -6 }}
    className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-8 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-default group overflow-hidden"
  >
    {/* Gradient border on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-400/20 via-transparent to-blue-400/20" />
    </div>
    
    <div className="relative">
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-5 transition-colors"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
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
      {/* Top Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              src="/logo.svg" 
              alt="SmarTrack" 
              className="h-8 w-auto cursor-pointer" 
            />
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Demo', 'Docs', 'FAQ'].map((item, i) => {
                const isLink = item === 'FAQ' || item === 'Docs'
                const linkPath = item === 'FAQ' ? '/faq' : item === 'Docs' ? '/docs' : ''
                
                return isLink ? (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                  >
                    <Link
                      to={linkPath}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium relative group"
                    >
                      {item}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.button
                    key={item}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                    onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium relative group"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
                  </motion.button>
                )
              })}
            </div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => loginWithRedirect()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all hover:shadow-lg hover:shadow-slate-200/50"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Fade in and slide up */}
      <section className="relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-full text-sm text-blue-700 font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              Professional Knowledge Engine
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={staggerItem}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight"
            >
              Institutional Memory,
              <br />
              <motion.span 
                className="text-blue-600 inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                Automated.
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg sm:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              The professional-grade capture engine for high-output teams. Archive articles, technical papers, and industry threads into a searchable, AI-powered knowledge hub instantly.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
            >
              <motion.button
                onClick={() => loginWithRedirect()}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all duration-300 text-lg overflow-hidden group"
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                />
                <Chrome className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Add to Chrome — It's Free</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('docs')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-4 text-slate-700 hover:text-slate-900 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all text-lg"
              >
                View Documentation
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
            >
              {[
                { text: 'Free forever', icon: CheckCircle2 },
                { text: 'No credit card', icon: CheckCircle2 },
                { text: 'Privacy-first', icon: CheckCircle2 }
              ].map((item, i) => (
                <motion.span 
                  key={item.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <item.icon className="w-4 h-4 text-green-500" />
                  {item.text}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Extension Preview Section */}
      <section className="bg-gradient-to-b from-slate-50/80 to-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              One-Click Capture
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Save any webpage instantly with AI-generated summaries and automatic categorization.
            </motion.p>
          </motion.div>
          <ExtensionPreview />
        </div>
      </section>

      {/* Features Grid - 3 Pillars with staggered entrance */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              Built for Knowledge Professionals
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Three core capabilities that transform how you capture, organize, and retrieve information.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeaturePillar
              icon={<Chrome className="w-6 h-6" />}
              title="Universal Capture"
              description="High-fidelity extraction of clean text from any webpage or social thread via the Chrome Extension. Works everywhere—documentation, articles, tweets, PDFs."
              index={0}
            />
            <FeaturePillar
              icon={<FolderTree className="w-6 h-6" />}
              title="Autonomous Taxonomy"
              description="AI that understands professional frameworks to categorize your research without manual tagging. Your library organizes itself as you save."
              index={1}
            />
            <FeaturePillar
              icon={<Search className="w-6 h-6" />}
              title="Semantic Discovery"
              description="Find insights using natural language queries across your entire institutional archive. Search by meaning, not just keywords."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="demo" className="bg-gradient-to-b from-slate-50/80 to-white border-y border-slate-200/80 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              Your Knowledge Hub
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Everything you capture—searchable, organized, and accessible from any device.
            </motion.p>
          </motion.div>
          <DashboardPreview />
        </div>
      </section>

      {/* Documentation Section */}
      <section id="docs" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              Documentation
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Everything you need to get started and make the most of SmarTrack.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: 'Getting Started',
                description: 'Install the extension and save your first page in under 2 minutes.',
                link: '#'
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: 'Capture Shortcuts',
                description: 'Master keyboard shortcuts: ⌘+Shift+S on Mac, Ctrl+Shift+S on Windows.',
                link: '#'
              },
              {
                icon: <Search className="w-6 h-6" />,
                title: 'Search & Discovery',
                description: 'Learn advanced search operators and semantic query techniques.',
                link: '#'
              }
            ].map((doc, index) => (
              <motion.a
                key={index}
                href={doc.link}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                whileHover={{ scale: 1.02, y: -6 }}
                className="relative block bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-8 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden"
              >
                {/* Gradient border on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-400/20 via-transparent to-blue-400/20" />
                </div>
                
                <div className="relative">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-12 h-12 bg-slate-100 group-hover:bg-blue-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:text-blue-600 mb-5 transition-colors"
                  >
                    {doc.icon}
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                    {doc.title}
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-slate-600">{doc.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-slate-900 py-20 sm:py-28 overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-slate-900 to-blue-900/20"
          style={{ backgroundSize: '200% 100%' }}
        />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={shouldAnimate ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Ready to build your
              <br />
              institutional memory?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto"
            >
              Join thousands of professionals who've transformed how they capture and organize knowledge.
            </motion.p>
            <motion.div
              variants={fadeInScale}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.button
                onClick={() => loginWithRedirect()}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-300 text-lg overflow-hidden group"
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                />
                <Chrome className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Add to Chrome — It's Free</span>
                <ArrowRight className="w-5 h-5 relative z-10" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="SmarTrack" className="h-6 w-auto" />
              <span className="text-slate-500 text-sm">© {new Date().getFullYear()} SmarTrack. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-500">
              <Link to="/docs" className="hover:text-slate-900 transition-colors">Documentation</Link>
              <Link to="/faq" className="hover:text-slate-900 transition-colors">FAQ</Link>
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
              <a href="mailto:support@smartrack.app" className="hover:text-slate-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
