import React from 'react'
import { Search, X, Tag } from 'lucide-react'

export const CategorySelectionPreview = () => {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 px-4 py-3.5">
        <div className="text-white text-center">
          <h3 className="font-semibold text-sm">Save to SmarTrack</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3.5 bg-white">
        {/* Category Label */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-500" />
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">Category</label>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            readOnly
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>

        {/* Category List */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {/* Selected Item */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-blue-50 border-l-3 border-blue-500">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-blue-700">Articles</span>
              </div>
              <button className="w-5 h-5 rounded-md bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors">
                <X className="w-3 h-3 text-blue-600" />
              </button>
            </div>

            {/* Other Items */}
            {['Tools', 'References', 'Other', 'Test', 'Marketing'].map((category) => (
              <div
                key={category}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-xs">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
