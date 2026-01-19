import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'framer-motion'
import { ArrowLeft, Chrome, Shield, Eye, Database, Lock, UserCheck, FileText, Scale, AlertTriangle, XCircle, CheckCircle, Mail } from 'lucide-react'
import { Logo } from '../components/Logo'

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

// Privacy sections (Part I)
const privacySections = [
  {
    icon: Eye,
    title: '1. Data Collection and Usage',
    content: `This section describes the data practices of SmarTrack ("Company", "we", "us", or "our") regarding the SmarTrack Browser Extension (the "Extension") and the dashboard located at smar-track.vercel.app (the "Service"). By using the Service, you acknowledge these practices.`
  },
  {
    icon: Shield,
    title: '2. Browser Permissions',
    content: `The Extension utilizes specific browser permissions strictly to facilitate technical features. Access to data is triggered solely by manual user interaction.

**Permission | Technical Function | Data Interaction**

**activeTab | Manual Trigger |** Interacts with the URL and metadata only when the user clicks the Service icon.

**storage | Local State |** Stores session tokens and user-defined preferences locally on the user's device.

**scripting | DOM Parsing |** Executes local scripts to parse metadata and text highlights.

**Host (*/*) | Universal Function |** Allows the Service to be used across various web domains.`
  },
  {
    icon: Lock,
    title: '3. Technical Restrictions',
    content: `**Background Monitoring:** The Service does not monitor browsing history or user activity on pages not explicitly saved by the user.

**Code Execution:** All executable logic is bundled locally. The Service does not utilize eval() or dynamically loaded external scripts.

**Third-Party Transfers:** We do not sell or trade information to third-party data brokers.`
  },
  {
    icon: Database,
    title: '4. Data Retention and Removal',
    content: `**Retention:** Data is maintained only while the user account remains active.

**Account Termination:** Users may initiate data removal via Settings → Account.

**Purge Timeline:** Upon account deletion, PII and saved content are purged from production systems and backups within thirty (30) days.`
  },
  {
    icon: Shield,
    title: '5. GDPR/CCPA Compliance & Your Legal Rights',
    content: `**Legal Basis for Processing:**
We process your personal data based on the following legal grounds:
• **Performance of Contract:** Processing necessary to provide the Service you requested (saving and organizing web content)
• **Consent:** You explicitly consent to data processing by using the Service
• **Legitimate Interest:** Processing necessary for security, fraud prevention, and service improvement

**Your Rights Under GDPR (EU Users) and CCPA (California Users):**

**Right to Access:** You may request a copy of all personal data we hold about you in a structured, machine-readable format (JSON/Markdown).

**Right to Rectification:** You may correct inaccurate data through your dashboard Settings or by contacting us.

**Right to Erasure (Right to be Forgotten):** You may delete your account and all associated data at any time via Settings → Account. We will purge all data, including encrypted backups, within thirty (30) days.

**Right to Data Portability:** You may export your saved content in a structured format (JSON/Markdown) for transfer to another service.

**Right to Object:** You may withdraw consent for data processing at any time by deleting your account, which will result in termination of Service.

**Right to Restrict Processing:** You may request that we limit how we process your data by contacting us.

**Right to Withdraw Consent:** You may withdraw your consent at any time without affecting the lawfulness of processing based on consent before withdrawal.

**Non-Discrimination (CCPA):** We will not discriminate against you for exercising your privacy rights.

**How to Exercise Your Rights:**
Contact us at smart.track.appp@gmail.com with your request. We will respond within thirty (30) days.`
  }
]

// Terms sections (Part II)
const termsSections = [
  {
    icon: CheckCircle,
    title: '1. Acceptance of Terms',
    content: `Use of the Service constitutes acceptance of these Terms. If you do not agree, you must uninstall the Extension and cease all use of the Service immediately.`
  },
  {
    icon: UserCheck,
    title: '2. Eligibility',
    content: `The Service is not intended for individuals under the age of thirteen (13).`
  },
  {
    icon: Shield,
    title: '3. User Accounts',
    content: `Users are solely responsible for maintaining the security of their accounts. SmarTrack is not liable for any loss or damage arising from unauthorized access to a user account.`
  },
  {
    icon: FileText,
    title: '4. Intellectual Property',
    content: `**Company Property:** All rights, titles, and interests in the Service (excluding User Content) remain the exclusive property of the Company.

**User Content:** You retain ownership of the content you save. You grant the Company a limited license to host and display such content solely to provide the Service.`
  },
  {
    icon: XCircle,
    title: '5. Prohibited Conduct',
    content: `Users are prohibited from attempting to disrupt the Service, reverse-engineer its code, or use the Service for any illegal activity.`
  },
  {
    icon: AlertTriangle,
    title: '6. No Warranty and Limitation of Liability',
    content: `**"AS-IS" PROVISION:** THE SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. THE COMPANY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.

**NO RESPONSIBILITY:** THE COMPANY ASSUMES NO RESPONSIBILITY FOR THE ACCURACY, LEGALITY, OR CONTENT OF EXTERNAL WEBSITES SAVED BY USERS.

**LIMITATION OF LIABILITY:** TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT BE LIABLE FOR ANY DAMAGES (INDIRECT, CONSEQUENTIAL, OR OTHERWISE) ARISING FROM THE USE OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

**LIABILITY CAP:** NOTWITHSTANDING ANYTHING TO THE CONTRARY, THE COMPANY'S TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED ONE HUNDRED DOLLARS ($100.00 USD). THIS CAP APPLIES TO ALL CLAIMS, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE, AND REGARDLESS OF THE THEORY OF LIABILITY.`
  },
  {
    icon: Scale,
    title: '7. Indemnification',
    content: `You agree to hold the Company harmless from any claims, losses, or legal fees resulting from your use of the Service or your violation of these Terms.`
  }
]

export const LegalCenterPage: React.FC = () => {
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
              <Logo linkToHome={true}
                iconSize="sm" 
                className="h-6 sm:h-7"
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
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 border border-blue-100 rounded-full text-xs sm:text-sm text-blue-700 font-medium mb-4 sm:mb-6"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Legal Center
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4"
            >
              SmarTrack Legal Center
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-xs sm:text-sm text-slate-500"
            >
              Last Revised: January 14, 2026
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Content - All sections in one scrollable page */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-6 sm:space-y-8 md:space-y-12"
          >
            {/* Part I Header */}
            <motion.div
              variants={fadeInUp}
              className="bg-blue-50 rounded-xl sm:rounded-2xl border-2 border-blue-200 p-5 sm:p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">PART I: DATA HANDLING & PRIVACY PRACTICES</h2>
              </div>
            </motion.div>

            {/* Privacy Sections */}
            {privacySections.map((section, index) => {
              const Icon = section.icon
              return (
                <motion.div
                  key={`privacy-${index}`}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                  className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-5 sm:p-6 md:p-8"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600">
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

            {/* Part II Header */}
            <motion.div
              variants={fadeInUp}
              className="bg-purple-50 rounded-xl sm:rounded-2xl border-2 border-purple-200 p-5 sm:p-6 md:p-8 mt-12"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">PART II: TERMS OF SERVICE & DISCLAIMERS</h2>
              </div>
            </motion.div>

            {/* Terms Sections */}
            {termsSections.map((section, index) => {
              const Icon = section.icon
              return (
                <motion.div
                  key={`terms-${index}`}
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

            {/* Part III: Chrome Web Store Data Disclosure */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 p-5 sm:p-6 md:p-8"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center text-amber-600">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Part III: Chrome Web Store Data Disclosure</h2>
              </div>
              <div className="space-y-3 text-sm sm:text-base text-slate-600">
                <p><strong className="text-slate-900">Summary for Extension Reviewers:</strong></p>
                <p><strong className="text-slate-900">Single Purpose:</strong> SmarTrack allows users to save and organize web content into a personal library.</p>
                <p><strong className="text-slate-900">Data Usage:</strong> Metadata and text are only accessed when the user clicks "Save." Data is synchronized to a secure backend for cross-device access.</p>
                <p><strong className="text-slate-900">Privacy Commitment:</strong> No tracking of browsing history; no use of remote code; no selling of data.</p>
              </div>
            </motion.div>

            {/* Part IV: Contact */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-8 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100 p-5 sm:p-6 md:p-8 text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Part IV: Contact</h2>
              <p className="text-slate-600 mb-4">
                For inquiries regarding these practices or terms, please contact:
              </p>
              <div className="space-y-2">
                <div>
                  <strong className="text-slate-900">SmarTrack Legal Team</strong>
                </div>
              <a 
                href="mailto:smart.track.appp@gmail.com"
                className="text-blue-600 hover:text-blue-700 font-semibold block"
              >
                smart.track.appp@gmail.com
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
