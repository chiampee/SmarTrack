import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ArrowLeft, 
  Chrome, 
  Zap, 
  Globe, 
  HelpCircle,
  MessageCircle,
  Mail,
  Search,
  Sparkles
} from 'lucide-react'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

// FAQ Categories with questions
const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    color: 'blue',
    questions: [
      {
        q: 'How do I install SmarTrack?',
        a: 'Installing SmarTrack takes less than 30 seconds. Click "Add to Chrome" on our homepage, then click "Add to Chrome" in the Chrome Web Store. The extension icon will appear in your browser toolbar immediately. Sign in with your Google account to sync your saves across devices.'
      },
      {
        q: 'What browsers are supported?',
        a: 'SmarTrack currently supports Chrome and all Chromium-based browsers including Microsoft Edge, Brave, Arc, and Opera.'
      },
      {
        q: 'How do I save my first page?',
        a: 'There are three ways to save: (1) Click the SmarTrack icon in your browser toolbar, (2) Right-click anywhere on a page and select "Save to SmarTrack", or (3) Use the keyboard shortcut ⌘+Shift+S (Mac) or Ctrl+Shift+S (Windows). The extension will automatically extract the title, description, and content.'
      }
    ]
  },
  {
    id: 'features',
    title: 'Features & Functionality',
    icon: Sparkles,
    color: 'amber',
    questions: [
      {
        q: 'How does AI summarization work?',
        a: 'When you save a page, our AI reads the full content and generates a concise summary with key takeaways in 5-10 seconds. The summary highlights the main points, making it easy to recall why you saved something without re-reading the entire article.'
      },
      {
        q: 'Can I organize saves into folders or projects?',
        a: 'Yes! Create unlimited collections (we call them "Projects") to organize your research. You can also use tags, and our AI will automatically suggest categories based on content. Drag and drop to reorganize anytime.'
      },
      {
        q: 'Does SmarTrack work on paywalled content?',
        a: 'SmarTrack saves the content you can see. If you have access to a paywalled article (via subscription), the extension will capture that content. We also create a snapshot, so you\'ll have access even if your subscription lapses or the content changes.'
      },
      {
        q: 'Can I search the full text of saved articles?',
        a: 'Yes! Our search indexes the full text content of every saved page, not just titles and tags. Search for any phrase or concept, and we\'ll find it instantly across your entire library—even if you don\'t remember the title.'
      },
      {
        q: 'Can I save tweets and social media threads?',
        a: 'Absolutely. SmarTrack is optimized for Twitter/X threads, LinkedIn posts, Reddit discussions, and more. We\'ll capture the full thread context and unroll it into a readable format.'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical Questions',
    icon: Globe,
    color: 'slate',
    questions: [
      {
        q: 'What permissions does the extension need?',
        a: 'We request only essential permissions: (1) "activeTab" to read the current page when you click save, (2) "storage" to cache your saves locally, and (3) "identity" for Google sign-in. We don\'t request "all_urls" or any permissions that would allow passive browsing tracking.'
      },
      {
        q: 'Can I export my data?',
        a: 'Yes! Export your entire library as JSON (with full metadata) or Markdown (great for Obsidian/Notion). Go to Settings → Import/Export → Export All. Your data is always portable.'
      },
      {
        q: 'Does SmarTrack slow down my browser?',
        a: 'No. The extension is lightweight (<500KB) and only activates when you interact with it. It doesn\'t run background scripts or inject anything into pages you visit. Performance impact is virtually zero.'
      },
      {
        q: 'Can I use SmarTrack on mobile?',
        a: 'Currently, SmarTrack is desktop-only via the Chrome extension. Your saves sync to our web dashboard, which is fully mobile-responsive for viewing.'
      }
    ]
  }
]

// Individual FAQ Item Component
const FAQItem: React.FC<{
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
  index: number
}> = ({ question, answer, isOpen, onClick, index }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-20px" }}
    variants={fadeInUp}
    transition={{ duration: 0.4, delay: index * 0.05 }}
    className="border-b border-slate-200 last:border-b-0"
  >
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-5 px-1 text-left group"
    >
      <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors pr-4">
        {question}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0"
      >
        <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-400'}`} />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <p className="pb-5 px-1 text-slate-600 leading-relaxed">
            {answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
)

// Category Section Component
const FAQCategory: React.FC<{
  category: typeof faqCategories[0]
  openItems: Set<string>
  toggleItem: (id: string) => void
}> = ({ category, openItems, toggleItem }) => {
  const Icon = category.icon
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600'
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      transition={{ duration: 0.5 }}
      id={category.id}
      className="scroll-mt-24"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[category.color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{category.title}</h2>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-200 px-6">
        {category.questions.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.q}
            answer={faq.a}
            isOpen={openItems.has(`${category.id}-${index}`)}
            onClick={() => toggleItem(`${category.id}-${index}`)}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  )
}

export const FAQPage: React.FC = () => {
  const navigate = useNavigate()
  const { loginWithRedirect } = useAuth0()
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filter FAQs based on search
  const filteredCategories = searchQuery.trim()
    ? faqCategories.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          q => 
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : faqCategories

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img 
                src="/logo.svg?v=2" 
                alt="SmarTrack" 
                className="h-6 sm:h-7 w-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
            </div>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => loginWithRedirect()}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              <Chrome className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Start Free</span>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 border border-blue-100 rounded-full text-xs sm:text-sm text-blue-700 font-medium mb-4 sm:mb-6"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Help Center
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4"
            >
              Frequently Asked Questions
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-2"
            >
              Everything you need to know about SmarTrack. Can't find what you're looking for? Reach out to our team.
            </motion.p>

            {/* Search */}
            <motion.div
              variants={fadeInUp}
              className="max-w-xl mx-auto relative"
            >
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2 sm:py-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {faqCategories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => document.getElementById(cat.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {cat.title}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <FAQCategory
                key={category.id}
                category={category}
                openItems={openItems}
                toggleItem={toggleItem}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
              <p className="text-slate-600 mb-4">
                Try a different search term or browse categories above.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="bg-white border-t border-slate-200 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Can't find the answer you're looking for? Our team is here to help. Reach out and we'll get back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="mailto:smart.track.appp@gmail.com"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                <Mail className="w-5 h-5" />
                Contact Support
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 text-slate-700 font-semibold border border-slate-200 rounded-xl hover:border-slate-300 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} SmarTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
