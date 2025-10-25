import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../components';

export const TasksPage: React.FC = () => {
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
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 via-emerald-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <CheckSquare className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-green-900 to-blue-900 bg-clip-text text-transparent">
              Research Tasks
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Track research goals and follow-up actions with intelligent task management
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full shadow-lg">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span className="text-amber-700 font-bold text-lg">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 border border-green-200/60 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-green-900 mb-8 flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            What's Coming
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Task Management</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">Create and track research tasks and action items with smart categorization and progress tracking</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Due Dates</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">Set deadlines and reminders for research goals with intelligent scheduling and notifications</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Priority Levels</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">Organize tasks by importance and urgency with visual priority indicators and smart sorting</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Progress Tracking</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">Monitor completion rates and research progress with detailed analytics and insights</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200/60 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              For now, you can use the priority levels and labels in the Links section to organize your research goals. 
              <span className="font-semibold text-green-700"> Start building your research collection today!</span>
            </p>
            <Link to="/" className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 hover:from-green-700 hover:via-emerald-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CheckSquare className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Go to Links
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
