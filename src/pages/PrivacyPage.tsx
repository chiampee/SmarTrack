import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'framer-motion'
import { ArrowLeft, Chrome, Shield, Eye, Database, Lock, UserCheck, Globe, Trash2, Mail } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const sections = [
  {
    icon: Eye,
    title: 'Information We Collect',
    content: `We collect only the minimum information necessary to provide our service:

**Personally Identifiable Information**
• Email address (collected via Auth0/Google OAuth for authentication)
• Optional display name (if you choose to provide one)

**Authentication Information**
• Auth0 authentication tokens stored locally in your browser
• These tokens enable you to remain logged in across browser sessions
• Passwords are handled entirely by Auth0 (Google), never stored by us

**Location Information**
• IP addresses are automatically collected by our backend server for API requests
• IP addresses are used for security (fraud prevention, rate limiting) and standard web server logging
• We do NOT collect GPS coordinates, precise location data, or location from your device

**Website Content**
• URLs of pages you explicitly choose to save
• Page titles, descriptions, and extracted text content from saved pages
• Page metadata (Open Graph tags, article information, favicons)
• User-selected text if you highlight content before saving
• Categories, tags, and notes you add to saved content
• AI-generated summaries of your saved content

**Usage Data**
• Basic aggregate analytics (anonymized page views, feature usage)
• Error logs for debugging and service improvement
• We do NOT track your browsing history, pages you don't save, clicks, keystrokes, or scroll behavior

**Data We Do NOT Collect**
• Health information
• Financial or payment information
• Personal communications (emails, texts, chat messages)
• Browsing history (we only save pages you explicitly choose to save)
• User activity monitoring (no tracking of clicks, mouse position, scroll, or keystrokes)`
  },
  {
    icon: Database,
    title: 'How We Use Your Data',
    content: `Your data is used exclusively for SmarTrack's single purpose: enabling you to save, organize, and retrieve web content in a searchable knowledge library.

**Primary Uses:**
• **Provide the Service** - Store and organize your saved content in your personal library
• **Authentication** - Manage your account access and session security
• **AI Processing** - Generate summaries and automatic categorizations of your saved content
• **Sync** - Keep your library accessible and synchronized across devices
• **Offline Functionality** - Queue saves when offline and sync when connectivity returns
• **Performance** - Cache data locally for fast access and instant searching
• **Support** - Help you troubleshoot issues when you contact us

**Data Sharing:**
• **Auth0 (Google)** - We use Auth0 for authentication services (approved use case for authentication providers)
• **No Third-Party Sales** - We do not sell, rent, or transfer your data to third parties
• **No Data Brokers** - We do not share your data with data brokers or advertising networks
• **No Unrelated Uses** - We do not use your data for purposes unrelated to knowledge management

**We Never:**
• Sell your data to third parties
• Use your content for advertising or marketing
• Share your data with data brokers
• Train AI models on your personal content
• Use your data to determine creditworthiness or for lending purposes
• Use your data for purposes unrelated to SmarTrack's single purpose`
  },
  {
    icon: Lock,
    title: 'Data Security',
    content: `We implement industry-standard security measures to protect your data:

• **Encryption in Transit** - All data transmitted via HTTPS/TLS encryption
• **Encryption at Rest** - All stored data is encrypted using industry-standard methods
• **Secure Infrastructure** - Data stored on secure servers operated by industry-leading cloud providers
• **Access Controls** - Role-based access controls and audit logs ensure only authorized access
• **Authentication** - Secure OAuth 2.0 authentication through Auth0 (Google), a trusted identity provider
• **Token Security** - Authentication tokens stored locally using Chrome's secure storage API
• **Password Security** - Your password is never stored by us; authentication is handled entirely by Auth0

**Third-Party Services:**
• **Auth0 (Google)** - Handles all authentication and password management according to their security standards
• **Backend API** - All API communications use HTTPS with proper certificate validation
• **No Remote Code** - All extension code is bundled locally; no external scripts or dynamic code execution`
  },
  {
    icon: Globe,
    title: 'Data Storage',
    content: `**Storage Location**
Your data is stored on secure servers operated by industry-leading cloud providers. Authentication is handled by Auth0 (Google), which stores authentication credentials according to their privacy policy.

**Local Storage**
Some data is stored locally in your browser using Chrome's storage API:
• Authentication tokens (for session management)
• User preferences and settings
• Offline queue of pending saves
• Cached links for fast access

**Server Storage**
Data stored on our backend servers includes:
• Your saved links and associated metadata
• Categories, tags, and notes you create
• AI-generated summaries
• IP addresses from API requests (for security and logging)

**Data Retention**
• Active accounts: Data retained while account is active
• Deleted content: Permanently removed within 30 days
• Closed accounts: All data deleted within 30 days
• IP addresses: Retained in server logs for security purposes, automatically purged according to standard retention policies`
  },
  {
    icon: UserCheck,
    title: 'Your Rights',
    content: `You have full control over your data:

• **Access** - View all data we have about you (Settings → Export)
• **Portability** - Export your data as JSON or Markdown anytime
• **Correction** - Edit or update your saved content
• **Deletion** - Delete individual items or your entire account
• **Restriction** - Contact us to limit how we process your data

We comply with applicable data protection laws. We do not sell personal information.`
  },
  {
    icon: Shield,
    title: 'Browser Extension Permissions',
    content: `The SmarTrack extension requests only the permissions necessary for its core functionality:

**Required Permissions:**

• **activeTab** - Access the current tab only when you explicitly click the extension icon. Used to:
  - Extract page title, URL, and description from the DOM
  - Capture user-selected text if you highlight content before saving
  - Extract favicon and Open Graph metadata for visual identification
  - Verify the page is fully loaded before saving

• **storage** - Store data locally in your browser. Used to:
  - Securely store Auth0 authentication tokens for session management
  - Maintain an offline queue for saves when the backend is unreachable
  - Store user preferences (categories, notification settings)
  - Cache saved links locally for fast access and offline viewing

• **scripting** - Inject content scripts to extract page information. Used to:
  - Access the page DOM to read Open Graph tags and meta descriptions
  - Extract clean text content by bypassing ads and navigation clutter
  - Capture user-selected text from the page
  - Access content within iframes when necessary for complete context

• **notifications** - Provide user feedback. Used to:
  - Notify you when a link has been successfully saved
  - Alert you if a save operation fails (network error, authentication issue)
  - Notify you when offline saves are successfully synced

• **Host Permissions (https://*/* and http://*/*)** - Universal compatibility. Used to:
  - Enable saving links from any website you visit
  - Extract page content, metadata, and DOM elements from saved pages
  - Communicate with our secure backend API for data storage
  - Enable seamless navigation to your SmarTrack dashboard

**Remote Code:**
• **No Remote Code** - All executable code is bundled locally within the extension package. We do not use external scripts, eval(), or dynamically loaded code. All network requests are standard HTTPS API calls for data storage, not code execution.

**Privacy Protections:**
• The extension only activates when you explicitly click the extension icon
• Page content is only accessed for the specific tab you choose to save
• We do NOT access tabs in the background without your interaction
• We do NOT track your browsing history or pages you don't save
• We do NOT monitor clicks, keystrokes, scroll behavior, or other user activity`
  },
  {
    icon: Trash2,
    title: 'Data Deletion',
    content: `**Delete Individual Items**
Remove any saved link from your dashboard at any time.

**Delete All Data**
Go to Settings → Account → Delete All Data to remove all saved content while keeping your account.

**Delete Account**
Go to Settings → Account → Delete Account to permanently delete your account and all associated data.

**Complete Purge**
Upon account deletion, all data is permanently removed from our systems within 30 days, including backups.`
  }
]

export const PrivacyPage: React.FC = () => {
  const navigate = useNavigate()
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img 
                src="/logo.svg" 
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

      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-50 border border-purple-100 rounded-full text-xs sm:text-sm text-purple-700 font-medium mb-4 sm:mb-6"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Privacy Policy
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4"
            >
              Your Privacy Matters
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-3 sm:mb-4 px-2"
            >
              We believe in transparency. Here's exactly how we handle your data—no legal jargon, just clear answers.
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-xs sm:text-sm text-slate-500"
            >
              Last updated: January 11, 2026
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 md:space-y-12">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.03 }}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-5 sm:p-6 md:p-8"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center text-purple-600">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{section.title}</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  {section.content.split('\n\n').map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line mb-3 sm:mb-4 last:mb-0">
                      {paragraph.split('**').map((part, i) => 
                        i % 2 === 1 ? <strong key={i} className="text-slate-900 font-semibold">{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </motion.div>
            )
          })}

          {/* Contact */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-blue-50 rounded-2xl border border-blue-100 p-8 text-center"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Questions About Privacy?</h2>
            <p className="text-slate-600 mb-4">
              We're happy to answer any questions about how we handle your data.
            </p>
            <a 
              href="mailto:privacy@smartrack.app"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              privacy@smartrack.app
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} SmarTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
