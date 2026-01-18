import React from 'react'
import { Search, X } from 'lucide-react'

export const CategorySelectionPreview = () => {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-b from-purple-600 via-purple-500 to-blue-500 px-4 py-3">
        <div className="text-white text-center">
          <h3 className="font-semibold text-sm">Save to SmarTrack</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 bg-white">
        {/* Category Label */}
        <label className="block text-xs font-medium text-slate-700">Category</label>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search"
            readOnly
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-500"
          />
        </div>

        {/* Category List */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="space-y-0">
            {/* Selected Item */}
            <div className="flex items-center justify-between px-3 py-2 bg-blue-600 text-white">
              <span className="text-xs font-medium">Articles</span>
              <button className="w-4 h-4 rounded-full bg-blue-700 flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>

            {/* Other Items */}
            {['Tools', 'References', 'Other', 'Test', 'Marketing'].map((category) => (
              <div
                key={category}
                className="px-3 py-2 text-white hover:bg-slate-700 transition-colors"
              >
                <span className="text-xs">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
