import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'framer-motion'
import { ArrowLeft, Chrome, Shield, Eye, Database, Lock, UserCheck, Globe, Mail } from 'lucide-react'

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
    title: '1. Data Collection and Categories',
    content: `We adhere to the principle of data minimization. We only collect information that is strictly necessary to provide the Service's functionality.

**A. Information You Provide Directly**

**Account Information:** When you authenticate via Auth0, we receive your email address and profile identifiers. This is used solely for session management and to associate your saved data with your account.

**User-Generated Content:** This includes URLs, page titles, text snippets, and categories that you explicitly choose to save via the Extension.

**B. Information Collected via Browser Permissions**

To function, the SmarTrack Extension requires specific permissions. Our legal justification for these permissions is the Performance of a Contract (providing you the features you requested):

**Active Tab Interaction (activeTab):** Used to read the current page's metadata and DOM only upon a manual trigger (clicking the icon).

**Local Data Management (storage):** Used to cache your preferences and maintain an offline queue to prevent data loss.

**DOM Processing (scripting):** Used to inject local scripts to extract "clean" text (removing ads/navigation) and to capture text you have highlighted.

**System Feedback (notifications):** Used to provide non-intrusive status updates on save/sync operations.

**Broad Host Permissions (https://*/*):** Required for the Service to function as a universal research tool across any website and to facilitate secure communication with our API (smartrack-back.onrender.com).`
  },
  {
    icon: Shield,
    title: '2. Chrome Web Store Compliance & Security',
    content: `**2.1 Remote Code Declaration**

The Company strictly prohibits the use of remote code. All executable logic is bundled locally within the Extension package. We do not use eval(), dynamic imports, or external scripts. This ensures the Service remains secure and verifiable by third-party reviewers.

**2.2 No Background Tracking**

The Service does not collect browsing history, monitor keystrokes, track scroll behavior, or utilize background processes to monitor user activity on pages that are not explicitly saved.`
  },
  {
    icon: Globe,
    title: '3. Third-Party Services and Data Transfers',
    content: `We do not sell your personal data. To provide the Service, we share limited data with the following sub-processors:

**Authentication:** Auth0 (Identity management)

**Hosting & Infrastructure:** Render (Backend API) and Vercel (Frontend Dashboard)

**Database:** Our secure cloud database where your encrypted research is stored

All data transfers are conducted via TLS 1.3 (HTTPS) encryption.`
  },
  {
    icon: Database,
    title: '4. Data Retention and Termination',
    content: `**Retention:** We retain your saved content as long as your account is active.

**User-Initiated Deletion:** You may delete individual items or clear your entire library at any time. This action is irreversible on our live servers.

**Account Deletion:** Upon account deletion through the Settings menu, all associated PII (Personally Identifiable Information) and saved content are flagged for immediate removal.

**Hard Purge:** We perform a complete purge of all data, including encrypted backups, within thirty (30) days of account termination.`
  },
  {
    icon: UserCheck,
    title: '5. Your Legal Rights',
    content: `Depending on your location, you may have the following rights regarding your data:

**Right to Access/Portability:** Request a copy of your data in a structured, machine-readable format (JSON/Markdown).

**Right to Rectification:** Correct inaccurate data in your dashboard.

**Right to Object:** Withdraw consent for data processing at any time (resulting in the termination of Service).

**Right to Erasure:** The "Right to be Forgotten" as outlined in Section 4.`
  },
  {
    icon: Lock,
    title: '6. Children\'s Privacy',
    content: `Our Service is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware of such collection, we will take immediate steps to delete the data.`
  },
  {
    icon: Mail,
    title: '7. Changes to This Policy',
    content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.`
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
              Privacy Policy
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-3 sm:mb-4 px-2"
            >
              This Privacy Policy describes how SmarTrack ("Company", "we", "us", or "our") collects, uses, and discloses your information when you use the SmarTrack Browser Extension and the SmarTrack Dashboard (collectively, the "Service").
            </motion.p>
            
            <motion.p
              variants={fadeInUp}
              className="text-sm text-slate-500 max-w-2xl mx-auto mb-3 sm:mb-4 px-2"
            >
              By installing the Extension or using the Service, you agree to the collection and use of information in accordance with this Privacy Policy.
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-xs sm:text-sm text-slate-500"
            >
              Last updated: January 13, 2026
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
            <h2 className="text-xl font-bold text-slate-900 mb-2">8. Contact Us</h2>
            <p className="text-slate-600 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="space-y-2">
              <div>
                <strong className="text-slate-900">SmarTrack Privacy Team</strong>
              </div>
              <a 
                href="mailto:privacy@smartrack.app"
                className="text-blue-600 hover:text-blue-700 font-semibold block"
              >
                privacy@smartrack.app
              </a>
              <a 
                href="https://smar-track.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold block"
              >
                smar-track.vercel.app
              </a>
            </div>
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
