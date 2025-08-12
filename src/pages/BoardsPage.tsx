import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../components';

export const BoardsPage: React.FC = () => {
  return (
    <div className="pt-0 px-4 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Links</span>
        </Link>
      </div>

      {/* Coming Soon Content */}
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <FolderOpen className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              Research Boards
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Organize your research into projects and topics with powerful collaboration tools
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full shadow-lg">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span className="text-amber-700 font-bold text-lg">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/60 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-blue-900 mb-8 flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            What's Coming
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Project Organization</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">Group related research by project, topic, or area of interest with intuitive drag-and-drop organization</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Focused Research</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">Keep your research organized and easily accessible with smart categorization and filtering</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔗</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Smart Linking</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">Connect related links and create research workflows with intelligent relationship mapping</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Progress Tracking</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">Monitor your research progress and completion with detailed analytics and insights</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200/60 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              For now, you can organize your research using labels and the powerful search features in the Links section. 
              <span className="font-semibold text-blue-700"> Start building your research collection today!</span>
            </p>
            <Link to="/" className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Go to Links
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
