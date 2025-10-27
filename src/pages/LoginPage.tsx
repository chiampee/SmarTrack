import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Shield, Cloud, Zap, BookOpen, Search, Tag, Link2, Brain, BarChart3, Clock, Globe, Lock } from 'lucide-react'

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all">
    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg text-white flex-shrink-0">{icon}</div>
    <div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-purple-200">{description}</p>
    </div>
  </div>
)

const Stat: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className="text-center">
    <div className="flex justify-center mb-2 text-blue-400">{icon}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-sm text-purple-200">{label}</div>
  </div>
)

export const LoginPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.svg" 
              alt="SmarTrack" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Welcome to SmarTrack
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-4 max-w-3xl mx-auto">
            The AI-powered research tool that saves you hours. Capture articles, extract insights, and find what matters—all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-purple-300">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI-Powered Content Analysis
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure & Private
            </span>
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Works Across All Devices
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="max-w-md mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Get Started</h2>
            <p className="text-purple-200 mb-8 text-center">
              Join researchers organizing their knowledge with AI
            </p>
            <button
              onClick={() => loginWithRedirect()}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg"
            >
              <Lock className="w-5 h-5" />
              Sign In Securely
            </button>
            <p className="text-sm text-purple-300 mt-6 text-center">
              ✓ Free forever • ✓ Secure & Private • ✓ No credit card required
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-white text-center mb-8">Everything You Need</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Feature
              icon={<BookOpen className="w-5 h-5" />}
              title="Instant Web Page Capture"
              description="Save any webpage, article, or paper with our browser extension. Auto-extract content, metadata, and images. Never lose important research again."
            />
            <Feature
              icon={<Brain className="w-5 h-5" />}
              title="AI Content Analysis"
              description="Automatically generate summaries, extract key points, and identify important topics. Get insights without reading entire documents."
            />
            <Feature
              icon={<Tag className="w-5 h-5" />}
              title="Smart Categorization"
              description="AI automatically organizes your research by topic, creates tags, and suggests collections. Stay organized without the manual work."
            />
            <Feature
              icon={<Search className="w-5 h-5" />}
              title="Lightning-Fast Search"
              description="Search across titles, content, tags, and summaries. Find exactly what you need in seconds with advanced filters and sorting."
            />
            <Feature
              icon={<Cloud className="w-5 h-5" />}
              title="Seamless Cloud Sync"
              description="Access your entire research library on any device. Changes sync instantly. Backup your data automatically in the cloud."
            />
            <Feature
              icon={<Shield className="w-5 h-5" />}
              title="Enterprise-Grade Privacy"
              description="End-to-end encryption, no data sharing, GDPR compliant. Your research stays private and yours forever."
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-white text-center mb-8">Why Researchers Choose SmarTrack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <Stat
              icon={<Link2 className="w-6 h-6" />}
              value="∞"
              label="Unlimited Saves"
            />
            <Stat
              icon={<BarChart3 className="w-6 h-6" />}
              value="Instant"
              label="AI Analysis"
            />
            <Stat
              icon={<Clock className="w-6 h-6" />}
              value="<1s"
              label="Search Speed"
            />
            <Stat
              icon={<Globe className="w-6 h-6" />}
              value="100%"
              label="Your Data"
            />
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-white text-center mb-8">Built for Knowledge Workers</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { role: 'Academic Researchers', task: 'Save papers, extract findings, build bibliographies' },
              { role: 'PhD Students', task: 'Organize literature reviews, track citations, manage sources' },
              { role: 'Journalists', task: 'Research stories, fact-check sources, archive evidence' },
              { role: 'Content Creators', task: 'Collect inspiration, track competitors, organize ideas' },
              { role: 'Product Managers', task: 'Research features, save competitors, track market trends' },
              { role: 'Lawyers & Paralegals', task: 'Save case law, extract key points, organize precedents' },
            ].map((item) => (
              <div
                key={item.role}
                className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/15 transition-all"
              >
                <h4 className="font-bold text-white mb-2">{item.role}</h4>
                <p className="text-sm text-purple-200">{item.task}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-white text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">1</div>
              <h4 className="font-bold text-white mb-2">Save</h4>
              <p className="text-sm text-purple-200">Install browser extension and save any webpage with one click</p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">2</div>
              <h4 className="font-bold text-white mb-2">Analyze</h4>
              <p className="text-sm text-purple-200">AI extracts content, generates summary, and identifies key topics</p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">3</div>
              <h4 className="font-bold text-white mb-2">Organize</h4>
              <p className="text-sm text-purple-200">Auto-categorize into collections, add tags, and structure your research</p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">4</div>
              <h4 className="font-bold text-white mb-2">Discover</h4>
              <p className="text-sm text-purple-200">Search instantly, find connections, and access from any device</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <p className="text-lg text-purple-200 mb-6 max-w-2xl mx-auto">
            Join thousands of researchers who have streamlined their workflow with AI-powered organization
          </p>
        </div>
      </div>
    </div>
  )
}
