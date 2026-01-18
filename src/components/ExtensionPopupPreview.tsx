import React from 'react'
import { Globe, X, ChevronDown } from 'lucide-react'

export const ExtensionPopupPreview = () => {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-b from-purple-600 via-purple-500 to-blue-500 px-4 py-3">
        <button className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <X className="w-3 h-3 text-white" />
        </button>
        <div className="text-white text-center">
          <h3 className="font-semibold text-sm">Save to SmarTrack</h3>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="text-white/90 text-xs">Smart Research Tracking</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-3 bg-white">
        {/* URL Field */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
              CN
            </div>
            <input
              type="text"
              value="CNBC Pro: Premium Live TV Stock Pe..."
              readOnly
              className="flex-1 px-2 py-1.5 text-xs border-2 border-red-300 border-r-slate-300 border-b-slate-300 rounded bg-white text-slate-700"
            />
            <button className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
              <X className="w-3 h-3 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Title Field */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
          <input
            type="text"
            value="Premium Live TX: Stock Plexu and investing insights"
            readOnly
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-700"
          />
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <textarea
            placeholder="Add notes or description"
            readOnly
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-500 resize-none h-16"
          />
        </div>

        {/* Category Field */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
          <div className="relative">
            <select
              value="Articles"
              disabled
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-700 appearance-none pr-8 cursor-not-allowed"
            >
              <option>Articles</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded text-slate-700 bg-white hover:bg-slate-50">
            Cancel
          </button>
          <button className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded font-medium hover:opacity-90">
            Save Link
          </button>
        </div>
      </div>
    </div>
  )
}
