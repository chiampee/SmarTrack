import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'framer-motion'
import { ArrowLeft, Chrome, FileText, CheckCircle, XCircle, AlertTriangle, Scale, RefreshCw, Mail } from 'lucide-react'
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

const sections = [
  {
    icon: CheckCircle,
    title: 'Acceptance of Terms',
    content: `By accessing or using SmarTrack ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.

These terms apply to all visitors, users, and others who access or use the Service. By using SmarTrack, you represent that you are at least 13 years of age, or the age of majority in your jurisdiction, whichever is greater.`
  },
  {
    icon: FileText,
    title: 'Description of Service',
    content: `SmarTrack is a knowledge management platform that allows you to:

• Save and organize web content via a browser extension
• Generate AI-powered summaries of saved content
• Search and retrieve your saved information
• Export your data in various formats

We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation.`
  },
  {
    icon: CheckCircle,
    title: 'Your Account',
    content: `**Account Creation**
You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.

**Account Responsibilities**
• You are responsible for all activity that occurs under your account
• You must notify us immediately of any unauthorized use
• You may not share your account with others
• You may not use another person's account without permission

**Account Termination**
You may delete your account at any time through Settings. We reserve the right to suspend or terminate accounts that violate these terms.`
  },
  {
    icon: FileText,
    title: 'User Content',
    content: `**Your Content**
You retain all ownership rights to the content you save to SmarTrack. By using the Service, you grant us a limited license to store, process, and display your content solely to provide the Service.

**Content Guidelines**
You agree not to save or share content that:
• Violates any applicable law or regulation
• Infringes on intellectual property rights of others
• Contains malware or harmful code
• Is fraudulent, misleading, or deceptive

**AI Processing**
By using our AI features, you consent to having your saved content processed by our AI systems for summarization and categorization. This processing is done solely to provide the Service to you.`
  },
  {
    icon: XCircle,
    title: 'Prohibited Uses',
    content: `You may not use SmarTrack to:

• Violate any laws or regulations
• Infringe on the rights of others
• Distribute spam or malicious content
• Attempt to gain unauthorized access to our systems
• Interfere with or disrupt the Service
• Reverse engineer or decompile the software
• Use automated means to access the Service (except our official extension)
• Resell or redistribute the Service without permission
• Use the Service for competitive analysis purposes

Violation of these terms may result in immediate account termination.`
  },
  {
    icon: Scale,
    title: 'Intellectual Property',
    content: `**Our Property**
The SmarTrack name, logo, software, and all related materials are owned by SmarTrack and protected by intellectual property laws. You may not use our trademarks without written permission.

**Your Property**
You retain ownership of all content you save. We claim no intellectual property rights over your saved content.

**Feedback**
If you provide feedback or suggestions, you grant us the right to use them without restriction or compensation.`
  },
  {
    icon: AlertTriangle,
    title: 'Disclaimers',
    content: `**As-Is Service**
The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.

**No Guarantee**
We do not guarantee that:
• The Service will be uninterrupted or error-free
• Defects will be corrected
• The Service is free of viruses or harmful components
• Results from using the Service will be accurate

**Third-Party Content**
We are not responsible for the accuracy, availability, or content of third-party websites you save.`
  },
  {
    icon: Scale,
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, SmarTrack shall not be liable for:

• Any indirect, incidental, special, consequential, or punitive damages
• Loss of profits, data, use, goodwill, or other intangible losses
• Damages resulting from unauthorized access to your account
• Damages resulting from any third-party content

Our total liability for any claim arising from your use of the Service shall not exceed $100.`
  },
  {
    icon: RefreshCw,
    title: 'Changes to Terms',
    content: `We reserve the right to modify these terms at any time. We will notify you of significant changes by:

• Posting the new terms on our website
• Sending you an email notification
• Displaying a notice in the application

Your continued use of the Service after changes constitutes acceptance of the new terms. If you disagree with the changes, you should stop using the Service and delete your account.`
  }
]

export const TermsPage: React.FC = () => {
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
              <Logo 
                iconSize="sm" 
                className="h-6 sm:h-7"
                showText={true}
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
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 border border-blue-100 rounded-full text-xs sm:text-sm text-blue-700 font-medium mb-4 sm:mb-6"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Terms of Service
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4"
            >
              Terms of Service
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-3 sm:mb-4 px-2"
            >
              Please read these terms carefully before using SmarTrack. By using our service, you agree to these terms.
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-xs sm:text-sm text-slate-500"
            >
              Last updated: January 1, 2026
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
            <h2 className="text-xl font-bold text-slate-900 mb-2">Questions About These Terms?</h2>
            <p className="text-slate-600 mb-4">
              If you have any questions about our Terms of Service, please contact us.
            </p>
            <a 
              href="mailto:legal@smartrack.app"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              legal@smartrack.app
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
