import React from 'react'
import { Globe, X, ChevronDown, Link2 } from 'lucide-react'

export const ExtensionPopupPreview = () => {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 px-4 py-3.5">
        <button className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
          <X className="w-3.5 h-3.5 text-white" />
        </button>
        <div className="text-white text-center">
          <h3 className="font-semibold text-sm">Save to SmarTrack</h3>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white/90 text-xs">Smart Research Tracking</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-3.5 bg-white">
        {/* URL Field */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Source</label>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Link2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium truncate">
              CNBC Pro: Premium Live TV Stock Pe...
            </div>
            <button className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Title Field */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Title</label>
          <input
            type="text"
            value="Premium Live TX: Stock Plexu and investing insights"
            readOnly
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
          <textarea
            placeholder="Add notes or description"
            readOnly
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-500 placeholder:text-slate-400 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>

        {/* Category Field */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
          <div className="relative">
            <select
              value="Articles"
              disabled
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none pr-8 cursor-not-allowed focus:outline-none"
            >
              <option>Articles</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button className="flex-1 px-3 py-2.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button className="flex-1 px-3 py-2.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm">
            Save Link
          </button>
        </div>
      </div>
    </div>
  )
}
