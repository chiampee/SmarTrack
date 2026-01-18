import React from 'react'
import { motion } from 'framer-motion'
import { 
  Chrome, 
  CheckCircle2, 
  ScanEye, 
  ShieldCheck, 
  LayoutGrid, 
  Search, 
  Sparkles,
  Menu,
  X,
  Lock,
  Star
} from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { LinkedInLogo, XLogo, RedditLogo, YouTubeLogo } from '../components/BrandLogos'

// CSS-based Silo vs Hub Diagram Component
const SiloVsHubDiagram: React.FC = () => {
  return (
    <div className="w-full bg-slate-50 rounded-lg p-6 sm:p-8 md:p-12">
      {/* Main Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-8 sm:mb-12">
        The Silo vs. The Hub
      </h3>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
        
        {/* LEFT: BEFORE (The Silo) */}
        <div className="relative">
          <h4 className="text-lg sm:text-xl font-bold text-slate-900 text-center mb-6">BEFORE (The Silo)</h4>
          
          {/* Confused Person */}
          <div className="flex justify-center mb-8 relative">
            <div className="relative">
              {/* Person figure - simplified */}
              <div className="w-16 h-20 sm:w-20 sm:h-24 mx-auto relative">
                {/* Head */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-300 rounded-full mx-auto mb-1"></div>
                {/* Body */}
                <div className="w-10 h-12 sm:w-12 sm:h-14 bg-blue-600 rounded-lg mx-auto"></div>
                {/* Question mark bubble */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-slate-400 rounded-full flex items-center justify-center">
                  <span className="text-slate-700 font-bold text-lg">?</span>
                </div>
              </div>
            </div>
          </div>

          {/* Silo Boxes */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Silo 1: X & LinkedIn */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg p-3 sm:p-4 shadow-lg relative border-2 border-slate-400 transition-transform group-hover:scale-105">
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="space-y-2 mb-2">
                  <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-center border border-slate-200">
                    <XLogo className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
                  </div>
                  <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-center border border-slate-200">
                    <LinkedInLogo className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-600 text-center font-medium">X / LinkedIn</p>
              </div>
            </div>

            {/* Silo 2: LinkedIn */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg p-3 sm:p-4 shadow-lg relative border-2 border-slate-400 transition-transform group-hover:scale-105">
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="space-y-2 mb-2">
                  <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-center border border-slate-200">
                    <LinkedInLogo className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-center border border-slate-200">
                    <LinkedInLogo className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-600 text-center font-medium">LinkedIn</p>
              </div>
            </div>

            {/* Silo 3: Chrome Bookmarks */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg p-3 sm:p-4 shadow-lg relative border-2 border-slate-400 transition-transform group-hover:scale-105">
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="space-y-2 mb-2">
                  <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-center gap-1 border border-slate-200">
                    <Chrome className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-center gap-1 border border-slate-200">
                    <Chrome className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-600 text-center font-medium">Chrome</p>
              </div>
            </div>

            {/* Silo 4: YouTube & Reddit */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg p-3 sm:p-4 shadow-lg relative border-2 border-slate-400 transition-transform group-hover:scale-105">
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="space-y-2 mb-2">
                  <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-center border border-slate-200">
                    <YouTubeLogo className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                  <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-center border border-slate-200">
                    <RedditLogo className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-600 text-center font-medium">YouTube / Reddit</p>
              </div>
            </div>
          </div>

          {/* Bottom Caption */}
          <p className="text-sm sm:text-base text-slate-600 text-center mt-6 font-medium">
            Your insights are trapped in someone else's app.
          </p>
        </div>

        {/* RIGHT: AFTER (The Hub) */}
        <div className="relative">
          <h4 className="text-lg sm:text-xl font-bold text-slate-900 text-center mb-6">AFTER (The Hub)</h4>
          
          {/* Data Streams */}
          <div className="relative mb-8 h-40 sm:h-48">
            {/* Curved lines flowing into funnel */}
            <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Open Web - Blue */}
              <path d="M 5 15 Q 35 25 75 35" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="2" y="18" fontSize="8" fill="#64748b" fontWeight="500">Open Web</text>
              
              {/* LinkedIn - Light Blue */}
              <path d="M 5 30 Q 35 40 75 45" stroke="#0a66c2" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="2" y="33" fontSize="8" fill="#64748b" fontWeight="500">LinkedIn</text>
              
              {/* YouTube - Red */}
              <path d="M 5 45 Q 35 50 75 55" stroke="#ff0000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="2" y="48" fontSize="8" fill="#64748b" fontWeight="500">YouTube</text>
              
              {/* Chrome Bookmarks - Green */}
              <path d="M 5 60 Q 35 60 75 65" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="2" y="63" fontSize="8" fill="#64748b" fontWeight="500">Chrome</text>
              
              {/* X - Black */}
              <path d="M 5 75 Q 35 70 75 75" stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="2" y="78" fontSize="8" fill="#64748b" fontWeight="500">X</text>
              
              {/* Reddit - Orange */}
              <path d="M 5 90 Q 35 80 75 85" stroke="#ff4500" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="2" y="93" fontSize="8" fill="#64748b" fontWeight="500">Reddit</text>
            </svg>
            
            {/* Funnel (SmarTrack Extension) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-br from-slate-300 to-slate-400 rounded-lg p-2.5 sm:p-3 shadow-xl border-2 border-slate-500">
                <div className="bg-blue-600 rounded-md p-1.5 sm:p-2 flex items-center justify-center">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-[10px] sm:text-xs text-slate-700 mt-1.5 text-center font-semibold">SmarTrack Extension</p>
              </div>
            </div>
          </div>

          {/* Person & Dashboard */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Person */}
            <div className="w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-300 rounded-full mx-auto mb-1"></div>
              <div className="w-10 h-12 sm:w-12 sm:h-14 bg-blue-600 rounded-lg mx-auto"></div>
            </div>

            {/* Dashboard */}
            <div className="flex-1 bg-white rounded-lg border-2 border-slate-300 shadow-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-bold text-slate-900">SmarTrack Dashboard</span>
              </div>
              
              {/* Dashboard Cards Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Card 1: LinkedIn Profile */}
                <div className="bg-blue-50 rounded p-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">NL</div>
                  <LinkedInLogo className="w-4 h-4 text-blue-600" />
                </div>
                
                {/* Card 2: YouTube */}
                <div className="bg-red-50 rounded p-2 flex items-center justify-center">
                  <YouTubeLogo className="w-5 h-5 text-red-600" />
                </div>
                
                {/* Card 3: Chrome */}
                <div className="bg-yellow-50 rounded p-2 flex items-center justify-center gap-1">
                  <Chrome className="w-4 h-4 text-blue-500" />
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                </div>
                
                {/* Card 4: X */}
                <div className="bg-slate-900 rounded p-2 flex items-center justify-center">
                  <XLogo className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Caption */}
          <p className="text-sm sm:text-base text-slate-600 text-center mt-6 font-medium">
            One source of truth for everything you know.
          </p>
        </div>
      </div>
    </div>
  )
}

export const LoginPage = () => {
  const { loginWithRedirect } = useAuth0()
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
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Search className="w-5 h-5 text-white stroke-[3]" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">SmarTrack</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
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
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
             <button 
                onClick={() => loginWithRedirect()}
                className="block w-full text-left px-4 py-2 text-slate-600 font-medium"
              >
                Sign In
              </button>
              <button 
                onClick={() => loginWithRedirect()}
                className="block w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg text-center"
              >
                Install Extension
              </button>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wide mb-8">
              <Sparkles className="w-3 h-3" />
              New: LinkedIn & YouTube Parsers
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Stop Losing Insights <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">to the Feed.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Centralize your research from LinkedIn, X, and the Open Web into one searchable intelligence hub. Capture the context, not just the link.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button 
                onClick={() => loginWithRedirect()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-lg shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1"
              >
                <Chrome className="w-5 h-5" />
                Install Chrome Extension
              </button>
              <p className="text-sm text-slate-500 font-medium">Free forever for personal use</p>
            </motion.div>

            {/* Dashboard Visual */}
            <motion.div 
              variants={fadeIn}
              className="relative rounded-xl bg-slate-900 p-2 sm:p-3 shadow-2xl ring-1 ring-slate-900/10"
            >
              <div className="rounded-lg overflow-hidden bg-slate-800 aspect-[16/10] relative">
                 <img 
                  src="/3_dashboard_view.png" 
                  alt="SmarTrack Dashboard Interface showing organized cards from LinkedIn, YouTube, and Web" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('image_50ae46')) {
                      target.src = '/image_50ae46.png';
                    } else {
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.classList.add('flex', 'items-center', 'justify-center', 'text-slate-500');
                        parent.innerHTML = '<span class="text-sm">Dashboard Preview (image missing)</span>';
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />
      </section>

      {/* 3. The Problem Section (Silo vs Hub) */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Your Knowledge is Fragmented.</h2>
            <p className="text-lg text-slate-600">
              You save a chart on LinkedIn. You bookmark a report on Chrome. But when you need them, they're buried by algorithms. 
              <span className="font-semibold text-slate-900"> If you can't find it, you didn't save it.</span>
            </p>
          </div>
          
          <div className="relative rounded-2xl bg-white p-4 sm:p-8 shadow-xl border border-slate-100">
            <SiloVsHubDiagram />
          </div>
        </div>
      </section>

      {/* 4. The Solution Section (The Bridge) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Escape the Walled Gardens.</h2>
            <p className="text-lg text-slate-600">SmarTrack is the bridge between your social feeds and your personal library.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -z-10" />

            {[
              {
                icon: ScanEye,
                title: "1. Capture",
                desc: "Extract full context—author, image, and text directly from the post."
              },
              {
                icon: ShieldCheck,
                title: "2. Sanitize",
                desc: "We strip tracking pixels and clean URLs locally on your device."
              },
              {
                icon: LayoutGrid,
                title: "3. Centralize",
                desc: "Insights land in one unified, searchable dashboard instantly."
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center bg-white p-4">
                <div className="w-24 h-24 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                  <step.icon className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Key Features Grid */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-slate-100 relative">
                 <img 
                  src="/1_save_link_popup.png" 
                  alt="Browser extension popup"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('image_01344c')) {
                      target.src = '/image_01344c.png';
                    }
                  }}
                />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Visual Recall</h3>
                <p className="text-slate-600">Don't just save the URL. Capture the thumbnail, author, and summary. Recognize your research instantly.</p>
              </div>
            </div>

             {/* Card 2 */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-slate-100 relative p-8 flex items-center justify-center">
                 <img 
                  src="/2_category_selection.png" 
                  alt="Supported platforms logos"
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('image_50adcc')) {
                      target.src = '/image_50adcc.png';
                    }
                  }}
                />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Platform Agnostic</h3>
                <p className="text-slate-600">Treat LinkedIn like the Open Web. PDF, Tweet, or Post—it all lives in one standardized format.</p>
              </div>
            </div>

             {/* Card 3 */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-slate-100 relative">
                 <img 
                  src="/3_dashboard_view.png" 
                  alt="List view of saved items"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('image_00bf70')) {
                      target.src = '/image_00bf70.png';
                    }
                  }}
                />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Built for Workflow</h3>
                <p className="text-slate-600">Track competitors, build swipe files, and recall prospect details with rich metadata tags.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Trust & Privacy */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20 pattern-grid-lg opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-8">
            <ShieldCheck className="w-4 h-4" />
            Privacy First Architecture
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Intelligence Without Intrusion.</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-12">
            Most tools demand passwords. SmarTrack is different. We use a <strong>Client-First Architecture</strong>. 
            The capture happens locally on your device. We never see your session data or passwords.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              "No Data Selling",
              "Client-Side Encryption",
              "Zero-Trust Design",
              "GDPR Ready"
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-slate-200 font-medium">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Footer CTA */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Reclaim Your Digital Memory.</h2>
          <p className="text-xl text-slate-600 mb-10">Join the researchers who have stopped bookmarking and started capturing.</p>
          <button 
            onClick={() => loginWithRedirect()}
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-lg shadow-xl shadow-blue-600/30 transition-transform hover:-translate-y-1"
          >
            <Chrome className="w-6 h-6" />
            Add to Chrome - It's Free
          </button>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
            <a href="/legal" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="/legal" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="mailto:smart.track.appp@gmail.com" className="hover:text-slate-900 transition-colors">Contact Support</a>
          </div>
          <p className="mt-8 text-xs text-slate-400">© {new Date().getFullYear()} SmarTrack Intelligence. All rights reserved.</p>
        </div>
      </section>

    </div>
  )
}

export default LoginPage
