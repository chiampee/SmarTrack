import React from 'react'
import { Search, X, Tag } from 'lucide-react'

export const CategorySelectionPreview = () => {
  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 px-3 sm:px-4 py-3 sm:py-4">
        <div className="text-white text-center pt-0.5 sm:pt-1">
          <h3 className="font-semibold text-xs sm:text-sm">Save to SmarTrack</h3>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 pt-4 sm:pt-5 pb-3 sm:pb-4 space-y-3 sm:space-y-3.5 bg-white">
        {/* Category Label */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wide">Category</label>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            readOnly
            className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-md sm:rounded-lg bg-white text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>

        {/* Category List */}
        <div className="bg-slate-50 border border-slate-200 rounded-md sm:rounded-lg overflow-hidden">
          <div className="max-h-40 sm:max-h-48 overflow-y-auto">
            {/* Selected Item */}
            <div className="flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 bg-blue-50 border-l-2 sm:border-l-3 border-blue-500">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] sm:text-xs font-semibold text-blue-700">Articles</span>
              </div>
              <button className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md bg-blue-100 hover:bg-blue-200 active:bg-blue-300 flex items-center justify-center transition-colors touch-manipulation">
                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
              </button>
            </div>

            {/* Other Items */}
            {['Tools', 'References', 'Other', 'Test', 'Marketing'].map((category) => (
              <div
                key={category}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation"
              >
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-300" />
                <span className="text-[10px] sm:text-xs">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
