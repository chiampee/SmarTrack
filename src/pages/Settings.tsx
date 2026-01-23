import React, { useState, useEffect } from 'react'
import { LATEST_EXTENSION_VERSION } from '../constants/extensionVersion'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Shield, 
  Palette, 
  Download,
  Trash2,
  Save,
  AlertTriangle,
  LogOut,
  ExternalLink,
  ArrowLeft,
  Lock,
  Database,
  Settings as SettingsIcon,
  Chrome,
  CheckCircle2
} from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'framer-motion'
import { UsageStats } from '../components/UsageStats'
import { useBackendApi } from '../hooks/useBackendApi'
import { useToast } from '../components/Toast'
import { useExtensionDetection } from '../hooks/useExtensionDetection'

export const Settings: React.FC = () => {
  const { user, logout } = useAuth0()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'usage' | 'preferences'>('general')
  const { makeRequest } = useBackendApi()
  const toast = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [accountConfirmText, setAccountConfirmText] = useState('')
  const { isExtensionInstalled } = useExtensionDetection()
  
  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  const handleDownloadExtension = () => {
    const linkElement = document.createElement('a')
    const filename = `SmarTrack-extension-v${LATEST_EXTENSION_VERSION}.zip`
    linkElement.setAttribute('href', `/${filename}`)
    linkElement.setAttribute('download', filename)
    linkElement.click()
    toast.success('Extension download started!')
  }

  const handleDeleteAll = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    try {
      setIsDeleting(true)
      const response = await makeRequest<{ message: string; deletedCount: number }>('/api/links', {
        method: 'DELETE',
        headers: {
          'X-Confirm-Delete-All': 'yes'
        }
      })
      toast.success(`${response.deletedCount} links deleted successfully`)
      setShowDeleteConfirm(false)
      setConfirmText('')
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete all links:', error)
      toast.error('Failed to delete all links. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Load profile on mount and auto-fill from Auth0 on first time
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      setIsLoadingProfile(true)
      try {
        const profile = await makeRequest<{ firstName?: string | null; lastName?: string | null; displayName?: string | null }>('/api/users/profile')
        
        if (profile.firstName || profile.lastName || profile.displayName) {
          // Profile exists - use saved values
          setFirstName(profile.firstName || '')
          setLastName(profile.lastName || '')
          // Use saved displayName, or fallback to Auth0 name, or firstName
          setDisplayName(profile.displayName || user?.name || user?.nickname || profile.firstName || '')
          setProfileLoaded(true)
        } else {
          // First time - auto-fill from Auth0
          // Priority: given_name/family_name > parse from name
          const auth0FirstName = (user as any)?.given_name || 
            (user?.name ? user.name.split(' ')[0] : '')
          const auth0LastName = (user as any)?.family_name || 
            (user?.name && user.name.split(' ').length > 1 
              ? user.name.split(' ').slice(1).join(' ') 
              : '')
          
          setFirstName(auth0FirstName)
          setLastName(auth0LastName)
          // Set displayName from Auth0 name or firstName
          setDisplayName(user?.name || user?.nickname || auth0FirstName || '')
          setProfileLoaded(true)
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        // On error, still try to auto-fill from Auth0
        const auth0FirstName = (user as any)?.given_name || 
          (user?.name ? user.name.split(' ')[0] : '')
        const auth0LastName = (user as any)?.family_name || 
          (user?.name && user.name.split(' ').length > 1 
            ? user.name.split(' ').slice(1).join(' ') 
            : '')
        setFirstName(auth0FirstName)
        setLastName(auth0LastName)
        // Set displayName from Auth0 name or firstName
        setDisplayName(user?.name || user?.nickname || auth0FirstName || '')
        setProfileLoaded(true)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    
    loadProfile()
  }, [user, makeRequest])

  // Auto-update display name when first name changes (only after profile is loaded)
  useEffect(() => {
    // Only auto-update after initial profile load to avoid overwriting saved displayName
    if (profileLoaded && firstName.trim()) {
      setDisplayName(firstName.trim())
    }
  }, [firstName, profileLoaded])

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      await makeRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          displayName: displayName.trim() || null,
        }),
      })
      toast.success('Profile updated successfully')
      // Dispatch event to notify other components (like Sidebar) to refresh
      window.dispatchEvent(new Event('profileUpdated'))
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (accountConfirmText !== 'DELETE ACCOUNT') {
      toast.error('Please type DELETE ACCOUNT to confirm')
      return
    }

    try {
      setIsDeletingAccount(true)
      const response = await makeRequest<{ 
        message: string
        deletionSummary: {
          linksDeleted: number
          collectionsDeleted: number
          userLimitsDeleted: boolean
          timestamp: string
        }
        compliance: {
          regulation: string
          right: string
          status: string
          timestamp: string
        }
      }>('/api/users/account', {
        method: 'DELETE',
        headers: {
          'X-Confirm-Delete-Account': 'yes'
        }
      })
      
      toast.success(`Account deleted successfully. ${response.deletionSummary.linksDeleted} links and ${response.deletionSummary.collectionsDeleted} collections removed.`)
      
      // Logout and redirect after successful deletion
      setTimeout(() => {
        logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        })
      }, 2000)
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      const errorMessage = error?.message || 'Failed to delete account. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: User, shortLabel: 'General' },
    { id: 'account', label: 'Account', icon: Shield, shortLabel: 'Account' },
    { id: 'usage', label: 'Usage & Limits', icon: Download, shortLabel: 'Usage' },
    { id: 'preferences', label: 'Preferences', icon: Palette, shortLabel: 'Prefs' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pb-6 sm:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-4 sm:pb-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors group touch-manipulation active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            <span className="text-sm font-semibold">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
              <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 leading-relaxed">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Premium Mobile UX */}
        <div className="bg-white rounded-2xl shadow-sm mb-4 sm:mb-6 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap relative min-w-fit flex-shrink-0 touch-manipulation ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 active:text-gray-900'
                  }`}
                >
                  <Icon 
                    className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`} 
                    strokeWidth={1.5}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-[14px]">{tab.shortLabel}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] sm:h-[2px] bg-blue-600 rounded-t-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isLoadingProfile || isSavingProfile}
                        placeholder="Enter your display name"
                        className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed touch-manipulation"
                        maxLength={100}
                      />
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        Automatically syncs from your first name. You can also edit it manually.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        Managed by your authentication provider
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2 sm:mb-2.5">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isLoadingProfile || isSavingProfile}
                          placeholder="Enter your first name"
                          className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed touch-manipulation"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2 sm:mb-2.5">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isLoadingProfile || isSavingProfile}
                          placeholder="Enter your last name"
                          className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed touch-manipulation"
                          maxLength={100}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoadingProfile || isSavingProfile}
                        className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm text-base sm:text-sm touch-manipulation min-h-[44px]"
                      >
                        {isSavingProfile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" strokeWidth={2} />
                            Save Profile
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extension Download */}
                {!isExtensionInstalled && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Browser Extension</h3>
                    <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Chrome className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1.5 text-base sm:text-lg">Install SmarTrack Extension</h4>
                          <p className="text-sm text-gray-600 mb-4 sm:mb-5 leading-relaxed">
                            Get the full power of SmarTrack! Save any webpage with one click, extract content automatically, and access your library from anywhere.
                          </p>
                          <button
                            onClick={handleDownloadExtension}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold shadow-sm text-base sm:text-sm touch-manipulation min-h-[44px]"
                          >
                            <Download className="w-4 h-4" strokeWidth={2} />
                            Download Extension
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extension Installed Status */}
                {isExtensionInstalled && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Browser Extension</h3>
                    <div className="bg-white border border-green-200 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-green-600" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1.5 text-base sm:text-lg">SmarTrack is Active</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Capture Enabled. You can save webpages directly from your browser.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Account Security */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Security</h3>
                  <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Lock className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1.5 text-base sm:text-lg">Auth0 Authentication</h4>
                        <p className="text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                          Your account is secured through Auth0. Password and security settings are managed in your Auth0 account.
                        </p>
                        <a
                          href="https://manage.auth0.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors touch-manipulation min-h-[44px]"
                        >
                          Security & Login
                          <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Actions</h3>
                  <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <button
                      onClick={() => logout()}
                      className="w-full px-5 py-3.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold text-base sm:text-sm touch-manipulation min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={2} />
                      Sign Out
                    </button>
                    
                    {/* Delete All Links */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Trash2 className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1.5 text-base sm:text-lg">Clear My Library</h4>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Danger Zone</p>
                          <p className="text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                            This will permanently delete all your saved links from the database. This action cannot be undone.
                          </p>
                          
                          {!showDeleteConfirm ? (
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 active:scale-[0.98] transition-all font-semibold flex items-center justify-center gap-2 shadow-sm touch-manipulation text-base sm:text-sm min-h-[44px]"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={2} />
                              Clear My Library
                            </button>
                          ) : (
                            <div className="space-y-4">
                              <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                Are you absolutely sure? Type <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">DELETE</span> to confirm.
                              </p>
                              <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all touch-manipulation min-h-[44px]"
                                autoFocus
                              />
                              <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                  onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setConfirmText('')
                                  }}
                                  className="flex-1 px-5 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all font-semibold touch-manipulation"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleDeleteAll}
                                  disabled={isDeleting || confirmText !== 'DELETE'}
                                  className="flex-1 px-5 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold touch-manipulation"
                                >
                                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Danger Zone</h3>
                  
                  {/* Delete Account */}
                  <div className="bg-white border-2 border-red-300 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-700" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1.5 text-base sm:text-lg">Permanently Delete Account</h4>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          This will permanently delete your account and <strong>all associated data</strong> including:
                        </p>
                        <ul className="text-sm text-gray-600 mb-3 sm:mb-4 list-disc list-inside space-y-1.5 leading-relaxed">
                          <li>All saved links</li>
                          <li>All collections</li>
                          <li>All user preferences and settings</li>
                          <li>All account data</li>
                        </ul>
                        <p className="text-sm text-red-600 font-semibold mb-4 sm:mb-5 leading-relaxed">
                          ⚠️ This action cannot be undone. Your data will be permanently deleted in compliance with GDPR/CCPA Right to Erasure.
                        </p>
                        
                        {!showDeleteAccountConfirm ? (
                          <button
                            onClick={() => setShowDeleteAccountConfirm(true)}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 active:scale-[0.98] transition-all font-semibold flex items-center justify-center gap-2 shadow-sm touch-manipulation text-base sm:text-sm min-h-[44px]"
                          >
                            <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                            Delete Account
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-gray-900 leading-relaxed">
                              Are you absolutely sure? Type <span className="font-mono bg-red-100 text-red-700 px-2 py-1 rounded">DELETE ACCOUNT</span> to confirm.
                            </p>
                            <input
                              type="text"
                              value={accountConfirmText}
                              onChange={(e) => setAccountConfirmText(e.target.value)}
                              placeholder="Type DELETE ACCOUNT"
                              className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-xl border border-red-400 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all touch-manipulation min-h-[44px]"
                              autoFocus
                            />
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => {
                                  setShowDeleteAccountConfirm(false)
                                  setAccountConfirmText('')
                                }}
                                className="flex-1 px-5 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all font-semibold touch-manipulation"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteAccount}
                                disabled={isDeletingAccount || accountConfirmText !== 'DELETE ACCOUNT'}
                                className="flex-1 px-5 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold touch-manipulation"
                              >
                                {isDeletingAccount ? 'Deleting Account...' : 'Confirm Account Deletion'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'usage' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Usage & Limits</h3>
                  <UsageStats />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Plan Information</h3>
                  <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                      <div>
                        <h4 className="text-lg sm:text-xl font-bold text-gray-900">Free Plan</h4>
                        <p className="text-sm text-gray-600 mt-1.5">
                          Current subscription tier
                        </p>
                      </div>
                      <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs sm:text-sm font-semibold">
                        Active
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <div className="flex items-center gap-2.5 mb-3">
                          <Download className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                          <span className="text-sm font-semibold text-gray-700">Links Limit</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">40</p>
                        <p className="text-xs text-gray-500">links per account</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <div className="flex items-center gap-2.5 mb-3">
                          <Database className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                          <span className="text-sm font-semibold text-gray-700">Storage Limit</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">40 KB</p>
                        <p className="text-xs text-gray-500">total storage</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Export Data</h3>
                  <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <p className="text-sm text-gray-600 mb-4 sm:mb-5 leading-relaxed">
                      Download all your research links as a JSON file for backup or migration.
                    </p>
                    <button
                      className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold shadow-sm touch-manipulation text-base sm:text-sm min-h-[44px]"
                      onClick={() => {
                        toast.info('Export functionality coming soon!')
                      }}
                    >
                      <Download className="w-4 h-4" strokeWidth={2} />
                      Export All Links
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Display Settings</h3>
                    <span className="px-2.5 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">Coming Soon</span>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 opacity-60 pointer-events-none">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900 mb-0.5">Dark Mode</p>
                        <p className="text-sm text-gray-500">Switch to dark theme</p>
                      </div>
                      <div className="bg-gray-300 w-12 h-6 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-semibold text-gray-900 mb-0.5">Compact View</p>
                        <p className="text-sm text-gray-500">Information Density</p>
                      </div>
                      <div className="bg-blue-600 w-12 h-6 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Default Settings</h3>
                  <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2 sm:mb-2.5">
                        Default View Mode
                      </label>
                      <select className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation min-h-[44px]">
                        <option>List View</option>
                        <option>Grid View</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2 sm:mb-2.5">
                        Items Per Page
                      </label>
                      <select className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation min-h-[44px]">
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                        <option>100</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold shadow-sm touch-manipulation text-base sm:text-sm min-h-[44px]">
                    <Save className="w-4 h-4" strokeWidth={2} />
                    Save Preferences
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
