import React from 'react'
import { 
  Linkedin, 
  Youtube, 
  Globe, 
  Lock, 
  Search,
  LayoutGrid,
  Filter
} from 'lucide-react'

export const SiloVsHubVisualization = () => {
  return (
    <div className="w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-stretch">
      
      {/* LEFT SIDE: THE SILO (BEFORE) */}
      <div className="relative bg-slate-50 rounded-3xl p-8 border border-slate-200 overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
        
        <div className="text-center mb-10">
          <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-2">Before: The Silo</h3>
          <p className="text-slate-400 text-sm">Data trapped in separate apps</p>
        </div>

        {/* The Silos Container */}
        <div className="relative flex flex-col gap-6 max-w-sm mx-auto">
          
          {/* Silo 1: LinkedIn */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm opacity-70 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
            <div className="w-12 h-12 bg-[#0077b5]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Linkedin className="w-6 h-6 text-[#0077b5]" />
            </div>
            <div className="flex-1">
              <div className="h-2 w-24 bg-slate-200 rounded mb-2" />
              <div className="h-2 w-16 bg-slate-100 rounded" />
            </div>
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Silo 2: YouTube */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm opacity-70 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
            <div className="w-12 h-12 bg-[#FF0000]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Youtube className="w-6 h-6 text-[#FF0000]" />
            </div>
            <div className="flex-1">
              <div className="h-2 w-24 bg-slate-200 rounded mb-2" />
              <div className="h-2 w-16 bg-slate-100 rounded" />
            </div>
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Silo 3: Web */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm opacity-70 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="h-2 w-24 bg-slate-200 rounded mb-2" />
              <div className="h-2 w-16 bg-slate-100 rounded" />
            </div>
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
          </div>

        </div>

        {/* Visual Barrier */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-100 to-transparent pointer-events-none" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-200 rounded-full text-xs font-semibold text-slate-500 flex items-center gap-2">
          <Search className="w-3 h-3" />
          Hard to find later
        </div>
      </div>


      {/* RIGHT SIDE: THE HUB (AFTER) */}
      <div className="relative bg-blue-50/50 rounded-3xl p-8 border border-blue-100 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400" />

        <div className="text-center mb-8">
          <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wider mb-2">After: The Hub</h3>
          <p className="text-blue-600/80 text-sm">Centralized & Searchable</p>
        </div>

        {/* The Flow Visualization */}
        <div className="relative flex flex-col items-center">
          
          {/* 1. Sources Row */}
          <div className="flex justify-center gap-4 mb-8">
             <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-blue-100 flex items-center justify-center text-[#0077b5]"><Linkedin className="w-5 h-5" /></div>
             <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-blue-100 flex items-center justify-center text-[#FF0000]"><Youtube className="w-5 h-5" /></div>
             <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-blue-100 flex items-center justify-center text-emerald-500"><Globe className="w-5 h-5" /></div>
          </div>

          {/* 2. The Funnel / Extension (Animated) */}
          <div className="relative z-10 mb-8">
            <svg className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-12 text-blue-200" viewBox="0 0 200 50" fill="none">
               <path d="M10 0 C 10 25, 100 0, 100 50" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
               <path d="M190 0 C 190 25, 100 0, 100 50" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
               <path d="M100 0 L 100 50" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
            
            <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center relative z-20">
               <Filter className="w-8 h-8 text-white" />
               <div className="absolute -bottom-2 px-2 py-0.5 bg-blue-800 text-white text-[10px] rounded-full font-bold">
                 FILTER
               </div>
            </div>
          </div>

          {/* 3. The Dashboard Card */}
          <div className="w-full max-w-xs bg-white rounded-xl shadow-xl shadow-blue-900/5 border border-blue-100 overflow-hidden relative z-10 transform transition-transform hover:scale-105 duration-300">
            {/* Header */}
            <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50">
               <div className="w-2 h-2 rounded-full bg-slate-300" />
               <div className="w-2 h-2 rounded-full bg-slate-300" />
               <div className="flex-1" />
               <LayoutGrid className="w-4 h-4 text-slate-300" />
            </div>
            
            {/* Content List */}
            <div className="p-4 space-y-3">
               {/* Item 1 */}
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 w-3/4 bg-slate-800 rounded mb-1.5" />
                    <div className="h-1.5 w-1/2 bg-slate-300 rounded" />
                  </div>
               </div>
               
               {/* Item 2 */}
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Youtube className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 w-2/3 bg-slate-800 rounded mb-1.5" />
                    <div className="h-1.5 w-1/2 bg-slate-300 rounded" />
                  </div>
               </div>

               {/* Item 3 */}
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 w-5/6 bg-slate-800 rounded mb-1.5" />
                    <div className="h-1.5 w-1/3 bg-slate-300 rounded" />
                  </div>
               </div>
            </div>

            {/* Bottom highlight */}
            <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 text-center">
              <span className="text-xs font-semibold text-blue-700">All data safe & searchable</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
