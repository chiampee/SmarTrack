import React from 'react'
import { motion } from 'framer-motion'
import { 
  Linkedin, 
  Youtube, 
  Globe, 
  Lock, 
  Search,
  LayoutGrid,
  Filter
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

export const SiloVsHubVisualization = () => {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
      className="w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-stretch"
    >
      
      {/* LEFT SIDE: THE SILO (BEFORE) */}
      <motion.div 
        variants={fadeInUp}
        className="relative bg-slate-50 rounded-3xl p-8 sm:p-10 border-2 border-slate-200/60 overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300" />
        
        <div className="text-center mb-10">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-600 uppercase tracking-wider mb-2">Before: The Silo</h3>
          <p className="text-slate-500 text-sm font-medium">Data trapped in separate apps</p>
        </div>

        {/* The Silos Container */}
        <div className="relative flex flex-col gap-5 max-w-sm mx-auto">
          
          {/* Silo 1: LinkedIn */}
          <motion.div 
            variants={fadeInUp}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-slate-200/80 shadow-sm opacity-75 grayscale-[0.8] transition-all duration-500 hover:grayscale-0 hover:opacity-100 hover:border-slate-300 hover:shadow-md cursor-default"
          >
            <div className="w-14 h-14 bg-[#0077b5]/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#0077b5]/20">
              <Linkedin className="w-7 h-7 text-[#0077b5] opacity-60" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="h-2.5 w-28 bg-slate-300 rounded mb-2.5" />
              <div className="h-2 w-20 bg-slate-200 rounded" />
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-300">
              <Lock className="w-5 h-5 text-slate-500" strokeWidth={2} fill="none" />
            </div>
          </motion.div>

          {/* Silo 2: YouTube */}
          <motion.div 
            variants={fadeInUp}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-slate-200/80 shadow-sm opacity-75 grayscale-[0.8] transition-all duration-500 hover:grayscale-0 hover:opacity-100 hover:border-slate-300 hover:shadow-md cursor-default"
          >
            <div className="w-14 h-14 bg-[#FF0000]/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#FF0000]/20">
              <Youtube className="w-7 h-7 text-[#FF0000] opacity-60" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="h-2.5 w-28 bg-slate-300 rounded mb-2.5" />
              <div className="h-2 w-20 bg-slate-200 rounded" />
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-300">
              <Lock className="w-5 h-5 text-slate-500" strokeWidth={2} fill="none" />
            </div>
          </motion.div>

          {/* Silo 3: Web */}
          <motion.div 
            variants={fadeInUp}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-slate-200/80 shadow-sm opacity-75 grayscale-[0.8] transition-all duration-500 hover:grayscale-0 hover:opacity-100 hover:border-slate-300 hover:shadow-md cursor-default"
          >
            <div className="w-14 h-14 bg-emerald-500/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
              <Globe className="w-7 h-7 text-emerald-500 opacity-60" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="h-2.5 w-28 bg-slate-300 rounded mb-2.5" />
              <div className="h-2 w-20 bg-slate-200 rounded" />
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-300">
              <Lock className="w-5 h-5 text-slate-500" strokeWidth={2} fill="none" />
            </div>
          </motion.div>

        </div>

        {/* Visual Barrier */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-100/90 via-slate-50/50 to-transparent pointer-events-none" />
        <motion.div 
          variants={fadeInUp}
          className="relative mt-8 flex justify-center"
        >
          <div className="px-5 py-2.5 bg-slate-300/60 backdrop-blur-sm rounded-full text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm border border-slate-400/30">
            <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
            Hard to find later
          </div>
        </motion.div>
      </motion.div>


      {/* RIGHT SIDE: THE HUB (AFTER) */}
      <motion.div 
        variants={fadeInUp}
        className="relative bg-gradient-to-br from-blue-50 via-indigo-50/30 to-blue-50 rounded-3xl p-8 sm:p-10 border-2 border-blue-200/60 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 shadow-sm" />

        <div className="text-center mb-10">
          <h3 className="text-xl sm:text-2xl font-bold text-blue-900 uppercase tracking-wider mb-2">After: The Hub</h3>
          <p className="text-blue-700/90 text-sm font-medium">Centralized & Searchable</p>
        </div>

        {/* The Flow Visualization */}
        <div className="relative flex flex-col items-center">
          
          {/* 1. Sources Row with animated flow */}
          <motion.div 
            variants={fadeInUp}
            className="flex justify-center gap-5 mb-10"
          >
             <motion.div 
               whileHover={{ scale: 1.1, y: -2 }}
               className="w-12 h-12 bg-white rounded-full shadow-md border-2 border-blue-200 flex items-center justify-center text-[#0077b5] transition-all"
             >
               <Linkedin className="w-6 h-6" />
             </motion.div>
             <motion.div 
               whileHover={{ scale: 1.1, y: -2 }}
               className="w-12 h-12 bg-white rounded-full shadow-md border-2 border-blue-200 flex items-center justify-center text-[#FF0000] transition-all"
             >
               <Youtube className="w-6 h-6" />
             </motion.div>
             <motion.div 
               whileHover={{ scale: 1.1, y: -2 }}
               className="w-12 h-12 bg-white rounded-full shadow-md border-2 border-blue-200 flex items-center justify-center text-emerald-500 transition-all"
             >
               <Globe className="w-6 h-6" />
             </motion.div>
          </motion.div>

          {/* 2. The Funnel / Extension (Animated) */}
          <motion.div 
            variants={fadeInUp}
            className="relative z-10 mb-10"
          >
            {/* Animated connecting lines */}
            <svg className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-16 text-blue-300/60" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Left curve */}
              <motion.path 
                d="M20 0 Q 20 20, 120 30 T 120 60" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeDasharray="5 5" 
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
              {/* Right curve */}
              <motion.path 
                d="M220 0 Q 220 20, 120 30 T 120 60" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeDasharray="5 5" 
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.3 }}
              />
              {/* Center line */}
              <motion.path 
                d="M120 0 L 120 60" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeDasharray="5 5" 
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              />
            </svg>
            
            {/* Filter Icon - More prominent and solid */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center relative z-20 border-2 border-blue-800/20"
            >
               <Filter className="w-10 h-10 text-white" strokeWidth={2.5} fill="white" fillOpacity={0.2} />
               <motion.div 
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.5 }}
                 className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-800 text-white text-[11px] rounded-full font-bold shadow-lg whitespace-nowrap"
               >
                 FILTER
               </motion.div>
            </motion.div>
          </motion.div>

          {/* 3. The Dashboard Card with staggered animations */}
          <motion.div 
            variants={fadeInUp}
            className="w-full max-w-xs bg-white rounded-xl shadow-2xl shadow-blue-900/10 border-2 border-blue-200/60 overflow-hidden relative z-10 transform transition-all hover:scale-[1.02] hover:shadow-2xl duration-300"
          >
            {/* Header */}
            <div className="h-12 border-b border-slate-200 flex items-center px-4 gap-2.5 bg-gradient-to-r from-slate-50 to-white">
               <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
               <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
               <div className="flex-1" />
               <LayoutGrid className="w-4 h-4 text-slate-400" strokeWidth={2} />
            </div>
            
            {/* Content List with staggered animation */}
            <div className="p-5 space-y-4">
               {/* Item 1 */}
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.2 }}
                 className="flex items-start gap-3"
               >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2.5 w-3/4 bg-slate-800 rounded mb-2" />
                    <div className="h-2 w-1/2 bg-slate-300 rounded" />
                  </div>
               </motion.div>
               
               {/* Item 2 */}
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.3 }}
                 className="flex items-start gap-3"
               >
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 border border-red-100 shadow-sm">
                    <Youtube className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2.5 w-2/3 bg-slate-800 rounded mb-2" />
                    <div className="h-2 w-1/2 bg-slate-300 rounded" />
                  </div>
               </motion.div>

               {/* Item 3 */}
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.4 }}
                 className="flex items-start gap-3"
               >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-sm">
                    <Globe className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2.5 w-5/6 bg-slate-800 rounded mb-2" />
                    <div className="h-2 w-1/3 bg-slate-300 rounded" />
                  </div>
               </motion.div>
            </div>

            {/* Bottom highlight */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-100 text-center">
              <span className="text-xs font-bold text-blue-700 tracking-wide">All data safe & searchable</span>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  )
}
