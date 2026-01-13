import React from 'react'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

export const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pb-4 sm:pb-0">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 sm:p-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Main</h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">Welcome to your main dashboard</p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-slate-600">
              This is the main page of your SmarTrack application.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
