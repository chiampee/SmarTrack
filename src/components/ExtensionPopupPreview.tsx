import React from 'react'
import { Globe, X, ChevronDown, Link2 } from 'lucide-react'

export const ExtensionPopupPreview = () => {
  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 px-3 sm:px-4 py-3 sm:py-4">
        <button className="absolute top-2 sm:top-3 right-2 sm:right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors touch-manipulation">
          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
        </button>
        <div className="text-white text-center pt-0.5 sm:pt-1">
          <h3 className="font-semibold text-xs sm:text-sm">Save to SmarTrack</h3>
        </div>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          </div>
          <span className="text-white/90 text-[10px] sm:text-xs">Smart Research Tracking</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-3 sm:px-4 pt-4 sm:pt-5 pb-3 sm:pb-4 space-y-3 sm:space-y-3.5 bg-white">
        {/* URL Field */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-slate-600 mb-1 sm:mb-1.5">Source</label>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <div className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-md sm:rounded-lg text-[10px] sm:text-xs text-slate-700 font-medium truncate">
              CNBC Pro: Premium Live TV Stock Pe...
            </div>
            <button className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation">
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Title Field */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-slate-600 mb-1 sm:mb-1.5">Title</label>
          <input
            type="text"
            value="Premium Live TX: Stock Plexu and investing insights"
            readOnly
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-md sm:rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-slate-600 mb-1 sm:mb-1.5">Description</label>
          <textarea
            placeholder="Add notes or description"
            readOnly
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-md sm:rounded-lg bg-white text-slate-500 placeholder:text-slate-400 resize-none h-16 sm:h-20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>

        {/* Category Field */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-slate-600 mb-1 sm:mb-1.5">Category</label>
          <div className="relative">
            <select
              value="Articles"
              disabled
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-md sm:rounded-lg bg-white text-slate-700 appearance-none pr-7 sm:pr-8 cursor-not-allowed focus:outline-none"
            >
              <option>Articles</option>
            </select>
            <ChevronDown className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 sm:gap-2.5 pt-1">
          <button className="flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 text-[10px] sm:text-xs font-medium border border-slate-300 rounded-md sm:rounded-lg text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation">
            Cancel
          </button>
          <button className="flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md sm:rounded-lg hover:opacity-90 active:opacity-80 transition-opacity shadow-sm touch-manipulation">
            Save Link
          </button>
        </div>
      </div>
    </div>
  )
}
